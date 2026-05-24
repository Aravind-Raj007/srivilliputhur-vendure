import { OrderCodeStrategy, RequestContext, TransactionalConnection, Injector } from '@vendure/core';

export class CustomSequentialOrderCodeStrategy implements OrderCodeStrategy {
    private connection: TransactionalConnection;
    private sequenceInitialized = false;

    init(injector: Injector) {
        this.connection = injector.get(TransactionalConnection);
    }

    async generate(ctx: RequestContext): Promise<string> {
        // Ensure sequence is initialized
        if (!this.sequenceInitialized) {
            await this.ensureSequenceExists();
        }

        // Get the next sequence value
        const nextVal = await this.getNextSequenceValue();

        // Generate 6 random lowercase letters
        const prefix = this.generateRandomLetters(6);

        // Format the sequential number padded to 5 digits (e.g. 00001)
        const paddedNum = String(nextVal).padStart(5, '0');

        return `${prefix}${paddedNum}`;
    }

    private async ensureSequenceExists(): Promise<void> {
        try {
            // Check if the sequence vendure.custom_order_code_seq already exists
            const seqCheck = await this.connection.rawConnection.query(`
                SELECT 1 FROM pg_class n
                JOIN pg_namespace ns ON n.relnamespace = ns.oid
                WHERE n.relname = 'custom_order_code_seq' AND ns.nspname = 'vendure' AND n.relkind = 'S';
            `);

            if (seqCheck.length === 0) {
                // Get max order ID to start the sequence from
                const maxIdRes = await this.connection.rawConnection.query('SELECT MAX(id) as max_id FROM "vendure"."order";');
                const maxId = maxIdRes[0]?.max_id || 0;
                const startVal = maxId + 1;

                await this.connection.rawConnection.query(`CREATE SEQUENCE vendure.custom_order_code_seq START WITH ${startVal};`);
            }
            this.sequenceInitialized = true;
        } catch (error) {
            console.error('Error ensuring order code sequence exists:', error);
            // Fallback: don't block order generation, let nextval throw or handle it
        }
    }

    private async getNextSequenceValue(): Promise<number> {
        const result = await this.connection.rawConnection.query("SELECT nextval('vendure.custom_order_code_seq') as next_val;");
        return Number(result[0].next_val);
    }

    private generateRandomLetters(length: number): string {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}
