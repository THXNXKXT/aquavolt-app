ALTER TABLE "invoices" ADD COLUMN "wifi_cost" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "wifi_enabled" boolean DEFAULT false;