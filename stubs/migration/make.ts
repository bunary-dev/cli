import { Schema } from "@bunary/orm";

export async function up(): Promise<void> {
	Schema.createTable("{{tableName}}", (table) => {
		table.increments("id");
		table.text("name");
		table.timestamps();
	});
}

export async function down(): Promise<void> {
	Schema.dropTable("{{tableName}}");
}
