
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"changes": NonNullable<Json>,"created_at": string,"entity": string,"entity_id": string | null,"id": number,"store_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"changes"?: NonNullable<Json>,"created_at"?: string,"entity": string,"entity_id"?: string | null,"id"?: never,"store_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"changes"?: NonNullable<Json>,"created_at"?: string,"entity"?: string,"entity_id"?: string | null,"id"?: never,"store_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_log_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"categories": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"image_asset_id": string | null,"is_visible": boolean,"name": string,"parent_id": string | null,"position": number,"slug": string,"store_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"image_asset_id"?: string | null,"is_visible"?: boolean,"name": string,"parent_id"?: string | null,"position"?: number,"slug": string,"store_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"image_asset_id"?: string | null,"is_visible"?: boolean,"name"?: string,"parent_id"?: string | null,"position"?: number,"slug"?: string,"store_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "categories_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "categories_store_id_image_asset_id_fkey"
      columns: ["store_id","image_asset_id"]
isOneToOne: false
      referencedRelation: "media_assets"
      referencedColumns: ["store_id","id"]
    },{
      foreignKeyName: "categories_store_id_parent_id_fkey"
      columns: ["store_id","parent_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["store_id","id"]
    }
                  ]
                },"customer_addresses": {
                  Row: {
                    "city": string,"country_code": string,"created_at": string,"customer_id": string,"id": string,"is_default": boolean,"label": string | null,"line1": string,"line2": string | null,"phone": string | null,"postal_code": string | null,"recipient_name": string,"region": string | null,"store_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "city": string,"country_code": string,"created_at"?: string,"customer_id": string,"id"?: string,"is_default"?: boolean,"label"?: string | null,"line1": string,"line2"?: string | null,"phone"?: string | null,"postal_code"?: string | null,"recipient_name": string,"region"?: string | null,"store_id": string,"updated_at"?: string
                  }
                  Update: {
                    "city"?: string,"country_code"?: string,"created_at"?: string,"customer_id"?: string,"id"?: string,"is_default"?: boolean,"label"?: string | null,"line1"?: string,"line2"?: string | null,"phone"?: string | null,"postal_code"?: string | null,"recipient_name"?: string,"region"?: string | null,"store_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "customer_addresses_store_id_customer_id_fkey"
      columns: ["store_id","customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["store_id","id"]
    },{
      foreignKeyName: "customer_addresses_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"customers": {
                  Row: {
                    "accepts_marketing": boolean,"created_at": string,"email": string,"full_name": string | null,"id": string,"notes": string | null,"phone": string | null,"store_id": string,"updated_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "accepts_marketing"?: boolean,"created_at"?: string,"email": string,"full_name"?: string | null,"id"?: string,"notes"?: string | null,"phone"?: string | null,"store_id": string,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "accepts_marketing"?: boolean,"created_at"?: string,"email"?: string,"full_name"?: string | null,"id"?: string,"notes"?: string | null,"phone"?: string | null,"store_id"?: string,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "customers_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"inventory": {
                  Row: {
                    "low_stock_threshold": number,"on_hand": number,"reserved": number,"store_id": string,"updated_at": string,"variant_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "low_stock_threshold"?: number,"on_hand"?: number,"reserved"?: number,"store_id": string,"updated_at"?: string,"variant_id": string
                  }
                  Update: {
                    "low_stock_threshold"?: number,"on_hand"?: number,"reserved"?: number,"store_id"?: string,"updated_at"?: string,"variant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventory_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_store_id_variant_id_fkey"
      columns: ["store_id","variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["store_id","id"]
    }
                  ]
                },"inventory_movements": {
                  Row: {
                    "created_at": string,"created_by": string | null,"delta": number,"id": number,"note": string | null,"order_id": string | null,"reason": Database["public"]['Enums']["stock_reason"],"store_id": string,"variant_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"delta": number,"id"?: never,"note"?: string | null,"order_id"?: string | null,"reason": Database["public"]['Enums']["stock_reason"],"store_id": string,"variant_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"delta"?: number,"id"?: never,"note"?: string | null,"order_id"?: string | null,"reason"?: Database["public"]['Enums']["stock_reason"],"store_id"?: string,"variant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventory_movements_order_fk"
      columns: ["store_id","order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["store_id","id"]
    },{
      foreignKeyName: "inventory_movements_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_movements_store_id_variant_id_fkey"
      columns: ["store_id","variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["store_id","id"]
    }
                  ]
                },"media_assets": {
                  Row: {
                    "alt_text": string | null,"bucket": string,"created_at": string,"created_by": string | null,"height": number | null,"id": string,"kind": Database["public"]['Enums']["asset_kind"],"mime_type": string,"path": string,"size_bytes": number,"source": Database["public"]['Enums']["asset_source"],"store_id": string,"width": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "alt_text"?: string | null,"bucket": string,"created_at"?: string,"created_by"?: string | null,"height"?: number | null,"id"?: string,"kind": Database["public"]['Enums']["asset_kind"],"mime_type": string,"path": string,"size_bytes": number,"source"?: Database["public"]['Enums']["asset_source"],"store_id": string,"width"?: number | null
                  }
                  Update: {
                    "alt_text"?: string | null,"bucket"?: string,"created_at"?: string,"created_by"?: string | null,"height"?: number | null,"id"?: string,"kind"?: Database["public"]['Enums']["asset_kind"],"mime_type"?: string,"path"?: string,"size_bytes"?: number,"source"?: Database["public"]['Enums']["asset_source"],"store_id"?: string,"width"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "media_assets_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string | null,"created_at": string,"id": string,"kind": string,"link": string | null,"read_at": string | null,"store_id": string | null,"title": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"kind": string,"link"?: string | null,"read_at"?: string | null,"store_id"?: string | null,"title": string,"user_id": string
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"kind"?: string,"link"?: string | null,"read_at"?: string | null,"store_id"?: string | null,"title"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"order_items": {
                  Row: {
                    "id": string,"line_total_amount": number,"order_id": string,"product_id": string | null,"product_name": string,"quantity": number,"sku": string | null,"store_id": string,"unit_price_amount": number,"variant_id": string | null,"variant_title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"line_total_amount": number,"order_id": string,"product_id"?: string | null,"product_name": string,"quantity": number,"sku"?: string | null,"store_id": string,"unit_price_amount": number,"variant_id"?: string | null,"variant_title": string
                  }
                  Update: {
                    "id"?: string,"line_total_amount"?: number,"order_id"?: string,"product_id"?: string | null,"product_name"?: string,"quantity"?: number,"sku"?: string | null,"store_id"?: string,"unit_price_amount"?: number,"variant_id"?: string | null,"variant_title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_items_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_store_id_order_id_fkey"
      columns: ["store_id","order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["store_id","id"]
    },{
      foreignKeyName: "order_items_store_id_product_id_fkey"
      columns: ["store_id","product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["store_id","id"]
    },{
      foreignKeyName: "order_items_store_id_variant_id_fkey"
      columns: ["store_id","variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["store_id","id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "access_token_hash": string,"buyer_note": string | null,"cancelled_at": string | null,"created_at": string,"currency": string,"customer_id": string | null,"discount_amount": number,"email": string,"id": string,"internal_note": string | null,"locale": string,"number": number,"paid_at": string | null,"placed_at": string,"shipping_address": Json | null,"shipping_amount": number,"shipping_method_id": string | null,"shipping_snapshot": NonNullable<Json>,"status": Database["public"]['Enums']["order_status"],"store_id": string,"subtotal_amount": number,"total_amount": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "access_token_hash": string,"buyer_note"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"currency": string,"customer_id"?: string | null,"discount_amount"?: number,"email": string,"id"?: string,"internal_note"?: string | null,"locale"?: string,"number": number,"paid_at"?: string | null,"placed_at"?: string,"shipping_address"?: Json | null,"shipping_amount"?: number,"shipping_method_id"?: string | null,"shipping_snapshot"?: NonNullable<Json>,"status"?: Database["public"]['Enums']["order_status"],"store_id": string,"subtotal_amount": number,"total_amount": number,"updated_at"?: string
                  }
                  Update: {
                    "access_token_hash"?: string,"buyer_note"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"currency"?: string,"customer_id"?: string | null,"discount_amount"?: number,"email"?: string,"id"?: string,"internal_note"?: string | null,"locale"?: string,"number"?: number,"paid_at"?: string | null,"placed_at"?: string,"shipping_address"?: Json | null,"shipping_amount"?: number,"shipping_method_id"?: string | null,"shipping_snapshot"?: NonNullable<Json>,"status"?: Database["public"]['Enums']["order_status"],"store_id"?: string,"subtotal_amount"?: number,"total_amount"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_store_id_customer_id_fkey"
      columns: ["store_id","customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["store_id","id"]
    },{
      foreignKeyName: "orders_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_store_id_shipping_method_id_fkey"
      columns: ["store_id","shipping_method_id"]
isOneToOne: false
      referencedRelation: "shipping_methods"
      referencedColumns: ["store_id","id"]
    }
                  ]
                },"page_versions": {
                  Row: {
                    "blocks": NonNullable<Json>,"created_at": string,"created_by": string | null,"id": string,"note": string | null,"page_id": string,"store_id": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "blocks": NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"id"?: string,"note"?: string | null,"page_id": string,"store_id": string,"version": number
                  }
                  Update: {
                    "blocks"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"id"?: string,"note"?: string | null,"page_id"?: string,"store_id"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "page_versions_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "page_versions_store_id_page_id_fkey"
      columns: ["store_id","page_id"]
isOneToOne: false
      referencedRelation: "pages"
      referencedColumns: ["store_id","id"]
    }
                  ]
                },"pages": {
                  Row: {
                    "created_at": string,"draft_blocks": NonNullable<Json>,"draft_updated_at": string,"id": string,"kind": Database["public"]['Enums']["page_kind"],"nav_position": number,"published_at": string | null,"published_version_id": string | null,"seo": NonNullable<Json>,"show_in_nav": boolean,"slug": string,"store_id": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"draft_blocks"?: NonNullable<Json>,"draft_updated_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["page_kind"],"nav_position"?: number,"published_at"?: string | null,"published_version_id"?: string | null,"seo"?: NonNullable<Json>,"show_in_nav"?: boolean,"slug": string,"store_id": string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"draft_blocks"?: NonNullable<Json>,"draft_updated_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["page_kind"],"nav_position"?: number,"published_at"?: string | null,"published_version_id"?: string | null,"seo"?: NonNullable<Json>,"show_in_nav"?: boolean,"slug"?: string,"store_id"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pages_published_version_fk"
      columns: ["id","published_version_id"]
isOneToOne: false
      referencedRelation: "page_versions"
      referencedColumns: ["page_id","id"]
    },{
      foreignKeyName: "pages_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"payment_events": {
                  Row: {
                    "error": string | null,"id": number,"payload": NonNullable<Json>,"processed_at": string | null,"provider": Database["public"]['Enums']["payment_provider"],"provider_event_id": string,"received_at": string,"store_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "error"?: string | null,"id"?: never,"payload": NonNullable<Json>,"processed_at"?: string | null,"provider": Database["public"]['Enums']["payment_provider"],"provider_event_id": string,"received_at"?: string,"store_id"?: string | null
                  }
                  Update: {
                    "error"?: string | null,"id"?: never,"payload"?: NonNullable<Json>,"processed_at"?: string | null,"provider"?: Database["public"]['Enums']["payment_provider"],"provider_event_id"?: string,"received_at"?: string,"store_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "payment_events_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"payments": {
                  Row: {
                    "amount": number,"created_at": string,"currency": string,"id": string,"order_id": string,"payment_method_id": string | null,"provider": Database["public"]['Enums']["payment_provider"],"provider_payment_id": string | null,"raw": NonNullable<Json>,"receipt_asset_id": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"status": Database["public"]['Enums']["payment_status"],"store_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"created_at"?: string,"currency": string,"id"?: string,"order_id": string,"payment_method_id"?: string | null,"provider": Database["public"]['Enums']["payment_provider"],"provider_payment_id"?: string | null,"raw"?: NonNullable<Json>,"receipt_asset_id"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["payment_status"],"store_id": string,"updated_at"?: string
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"currency"?: string,"id"?: string,"order_id"?: string,"payment_method_id"?: string | null,"provider"?: Database["public"]['Enums']["payment_provider"],"provider_payment_id"?: string | null,"raw"?: NonNullable<Json>,"receipt_asset_id"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["payment_status"],"store_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_store_id_order_id_fkey"
      columns: ["store_id","order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["store_id","id"]
    },{
      foreignKeyName: "payments_store_id_payment_method_id_fkey"
      columns: ["store_id","payment_method_id"]
isOneToOne: false
      referencedRelation: "store_payment_methods"
      referencedColumns: ["store_id","id"]
    },{
      foreignKeyName: "payments_store_id_receipt_asset_id_fkey"
      columns: ["store_id","receipt_asset_id"]
isOneToOne: false
      referencedRelation: "media_assets"
      referencedColumns: ["store_id","id"]
    }
                  ]
                },"platform_admins": {
                  Row: {
                    "created_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"product_images": {
                  Row: {
                    "asset_id": string,"position": number,"product_id": string,"store_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "asset_id": string,"position"?: number,"product_id": string,"store_id": string
                  }
                  Update: {
                    "asset_id"?: string,"position"?: number,"product_id"?: string,"store_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_images_store_id_asset_id_fkey"
      columns: ["store_id","asset_id"]
isOneToOne: false
      referencedRelation: "media_assets"
      referencedColumns: ["store_id","id"]
    },{
      foreignKeyName: "product_images_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_images_store_id_product_id_fkey"
      columns: ["store_id","product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["store_id","id"]
    }
                  ]
                },"product_variants": {
                  Row: {
                    "allow_backorder": boolean,"compare_at_amount": number | null,"cost_amount": number | null,"created_at": string,"id": string,"is_default": boolean,"options": NonNullable<Json>,"position": number,"price_amount": number,"product_id": string,"sku": string | null,"store_id": string,"title": string,"track_inventory": boolean,"updated_at": string,"weight_grams": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "allow_backorder"?: boolean,"compare_at_amount"?: number | null,"cost_amount"?: number | null,"created_at"?: string,"id"?: string,"is_default"?: boolean,"options"?: NonNullable<Json>,"position"?: number,"price_amount": number,"product_id": string,"sku"?: string | null,"store_id": string,"title"?: string,"track_inventory"?: boolean,"updated_at"?: string,"weight_grams"?: number | null
                  }
                  Update: {
                    "allow_backorder"?: boolean,"compare_at_amount"?: number | null,"cost_amount"?: number | null,"created_at"?: string,"id"?: string,"is_default"?: boolean,"options"?: NonNullable<Json>,"position"?: number,"price_amount"?: number,"product_id"?: string,"sku"?: string | null,"store_id"?: string,"title"?: string,"track_inventory"?: boolean,"updated_at"?: string,"weight_grams"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_variants_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_variants_store_id_product_id_fkey"
      columns: ["store_id","product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["store_id","id"]
    }
                  ]
                },"products": {
                  Row: {
                    "category_id": string | null,"created_at": string,"description": string | null,"id": string,"is_featured": boolean,"name": string,"search": unknown,"seo": NonNullable<Json>,"slug": string,"status": Database["public"]['Enums']["product_status"],"store_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_featured"?: boolean,"name": string,"search"?: never,"seo"?: NonNullable<Json>,"slug": string,"status"?: Database["public"]['Enums']["product_status"],"store_id": string,"updated_at"?: string
                  }
                  Update: {
                    "category_id"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_featured"?: boolean,"name"?: string,"search"?: never,"seo"?: NonNullable<Json>,"slug"?: string,"status"?: Database["public"]['Enums']["product_status"],"store_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_store_id_category_id_fkey"
      columns: ["store_id","category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["store_id","id"]
    },{
      foreignKeyName: "products_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"full_name": string | null,"guided": boolean,"id": string,"locale": string,"text_scale": number,"ui_mode": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"full_name"?: string | null,"guided"?: boolean,"id": string,"locale"?: string,"text_scale"?: number,"ui_mode"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string | null,"guided"?: boolean,"id"?: string,"locale"?: string,"text_scale"?: number,"ui_mode"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"shipping_methods": {
                  Row: {
                    "created_at": string,"description": string | null,"free_over_amount": number | null,"id": string,"is_active": boolean,"kind": Database["public"]['Enums']["shipping_kind"],"name": string,"position": number,"price_amount": number,"store_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"free_over_amount"?: number | null,"id"?: string,"is_active"?: boolean,"kind": Database["public"]['Enums']["shipping_kind"],"name": string,"position"?: number,"price_amount"?: number,"store_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"free_over_amount"?: number | null,"id"?: string,"is_active"?: boolean,"kind"?: Database["public"]['Enums']["shipping_kind"],"name"?: string,"position"?: number,"price_amount"?: number,"store_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "shipping_methods_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"stock_reservations": {
                  Row: {
                    "created_at": string,"expires_at": string,"id": string,"order_id": string,"quantity": number,"status": Database["public"]['Enums']["reservation_status"],"store_id": string,"updated_at": string,"variant_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"expires_at"?: string,"id"?: string,"order_id": string,"quantity": number,"status"?: Database["public"]['Enums']["reservation_status"],"store_id": string,"updated_at"?: string,"variant_id": string
                  }
                  Update: {
                    "created_at"?: string,"expires_at"?: string,"id"?: string,"order_id"?: string,"quantity"?: number,"status"?: Database["public"]['Enums']["reservation_status"],"store_id"?: string,"updated_at"?: string,"variant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stock_reservations_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_reservations_store_id_order_id_fkey"
      columns: ["store_id","order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["store_id","id"]
    },{
      foreignKeyName: "stock_reservations_store_id_variant_id_fkey"
      columns: ["store_id","variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["store_id","id"]
    }
                  ]
                },"store_counters": {
                  Row: {
                    "last_order_number": number,"store_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "last_order_number"?: number,"store_id": string
                  }
                  Update: {
                    "last_order_number"?: number,"store_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "store_counters_store_id_fkey"
      columns: ["store_id"]
isOneToOne: true
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"store_domains": {
                  Row: {
                    "created_at": string,"hostname": string,"id": string,"is_primary": boolean,"kind": Database["public"]['Enums']["domain_kind"],"store_id": string,"verified_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"hostname": string,"id"?: string,"is_primary"?: boolean,"kind": Database["public"]['Enums']["domain_kind"],"store_id": string,"verified_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"hostname"?: string,"id"?: string,"is_primary"?: boolean,"kind"?: Database["public"]['Enums']["domain_kind"],"store_id"?: string,"verified_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "store_domains_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"store_invitations": {
                  Row: {
                    "accepted_at": string | null,"created_at": string,"email": string,"expires_at": string,"id": string,"invited_by": string | null,"role": Database["public"]['Enums']["member_role"],"store_id": string,"token_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"created_at"?: string,"email": string,"expires_at"?: string,"id"?: string,"invited_by"?: string | null,"role"?: Database["public"]['Enums']["member_role"],"store_id": string,"token_hash": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"created_at"?: string,"email"?: string,"expires_at"?: string,"id"?: string,"invited_by"?: string | null,"role"?: Database["public"]['Enums']["member_role"],"store_id"?: string,"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "store_invitations_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"store_members": {
                  Row: {
                    "created_at": string,"role": Database["public"]['Enums']["member_role"],"store_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"role"?: Database["public"]['Enums']["member_role"],"store_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"role"?: Database["public"]['Enums']["member_role"],"store_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "store_members_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"store_payment_methods": {
                  Row: {
                    "connected_account_id": string | null,"connected_at": string | null,"created_at": string,"display_name": string,"id": string,"instructions": NonNullable<Json>,"is_enabled": boolean,"method_key": string,"position": number,"provider": Database["public"]['Enums']["payment_provider"],"secret_id": string | null,"store_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "connected_account_id"?: string | null,"connected_at"?: string | null,"created_at"?: string,"display_name": string,"id"?: string,"instructions"?: NonNullable<Json>,"is_enabled"?: boolean,"method_key"?: string,"position"?: number,"provider": Database["public"]['Enums']["payment_provider"],"secret_id"?: string | null,"store_id": string,"updated_at"?: string
                  }
                  Update: {
                    "connected_account_id"?: string | null,"connected_at"?: string | null,"created_at"?: string,"display_name"?: string,"id"?: string,"instructions"?: NonNullable<Json>,"is_enabled"?: boolean,"method_key"?: string,"position"?: number,"provider"?: Database["public"]['Enums']["payment_provider"],"secret_id"?: string | null,"store_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "store_payment_methods_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"stores": {
                  Row: {
                    "contact": NonNullable<Json>,"country_code": string,"created_at": string,"created_by": string | null,"currency": string,"default_locale": string,"id": string,"logo_asset_id": string | null,"name": string,"onboarding": NonNullable<Json>,"published_at": string | null,"slug": string,"status": Database["public"]['Enums']["store_status"],"theme_draft": NonNullable<Json>,"theme_published": NonNullable<Json>,"timezone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "contact"?: NonNullable<Json>,"country_code": string,"created_at"?: string,"created_by"?: string | null,"currency": string,"default_locale"?: string,"id"?: string,"logo_asset_id"?: string | null,"name": string,"onboarding"?: NonNullable<Json>,"published_at"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["store_status"],"theme_draft"?: NonNullable<Json>,"theme_published"?: NonNullable<Json>,"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "contact"?: NonNullable<Json>,"country_code"?: string,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"default_locale"?: string,"id"?: string,"logo_asset_id"?: string | null,"name"?: string,"onboarding"?: NonNullable<Json>,"published_at"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["store_status"],"theme_draft"?: NonNullable<Json>,"theme_published"?: NonNullable<Json>,"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stores_logo_asset_fk"
      columns: ["id","logo_asset_id"]
isOneToOne: false
      referencedRelation: "media_assets"
      referencedColumns: ["store_id","id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_store_invitation":
{ Args: { "p_token": string }; Returns: string
                           },
"adjust_stock":
{ Args: { "p_delta": number,"p_note"?: string,"p_reason": Database["public"]['Enums']["stock_reason"],"p_variant_id": string }; Returns: number
                           },
"apply_payment_status":
{ Args: { "p_payment_id": string,"p_provider_payment_id"?: string,"p_raw"?: Json,"p_status": Database["public"]['Enums']["payment_status"] }; Returns: undefined
                           },
"assert_store_member":
{ Args: { "p_store_id": string }; Returns: undefined
                           },
"commit_reservation":
{ Args: { "p_order_id": string }; Returns: undefined
                           },
"confirm_manual_payment":
{ Args: { "p_approve": boolean,"p_payment_id": string }; Returns: undefined
                           },
"create_store":
{ Args: { "p_country_code": string,"p_currency": string,"p_locale"?: string,"p_name": string,"p_slug": string,"p_timezone"?: string }; Returns: string
                           },
"extensions_digest":
{ Args: { "p_value": string }; Returns: string
                           },
"get_order_for_buyer":
{ Args: { "p_order_id": string,"p_token": string }; Returns: Json
                           },
"is_platform_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_store_member":
{ Args: { "p_store_id": string }; Returns: boolean
                           },
"is_store_owner":
{ Args: { "p_store_id": string }; Returns: boolean
                           },
"next_order_number":
{ Args: { "p_store_id": string }; Returns: number
                           },
"notify_store_owners":
{ Args: { "p_body"?: string,"p_kind": string,"p_link"?: string,"p_store_id": string,"p_title": string }; Returns: undefined
                           },
"publish_page":
{ Args: { "p_note"?: string,"p_page_id": string }; Returns: string
                           },
"publish_store":
{ Args: { "p_store_id": string }; Returns: undefined
                           },
"release_expired_reservations":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"release_reservation":
{ Args: { "p_order_id": string }; Returns: undefined
                           },
"reserve_stock":
{ Args: { "p_order_id": string,"p_ttl"?: string }; Returns: undefined
                           },
"restore_page_version":
{ Args: { "p_page_id": string,"p_version_id": string }; Returns: undefined
                           },
"try_uuid":
{ Args: { "p_value": string }; Returns: string
                           },
"write_audit":
{ Args: { "p_action": string,"p_changes"?: Json,"p_entity": string,"p_entity_id": string,"p_store_id": string }; Returns: undefined
                           }
          }
          Enums: {
            "asset_kind": "image"|"video"|"document","asset_source": "upload"|"ai","domain_kind": "subdomain"|"custom","member_role": "owner"|"staff","order_status": "pending_payment"|"paid"|"preparing"|"ready_for_pickup"|"shipped"|"delivered"|"cancelled"|"refunded","page_kind": "home"|"custom"|"about"|"contact"|"faq"|"legal","payment_provider": "mercadopago"|"manual"|"stripe"|"paypal","payment_status": "pending"|"in_review"|"approved"|"rejected"|"cancelled"|"refunded","product_status": "draft"|"active"|"archived","reservation_status": "active"|"committed"|"released","shipping_kind": "pickup"|"flat_rate"|"local_delivery","stock_reason": "sale"|"restock"|"adjustment"|"return"|"initial","store_status": "draft"|"published"|"suspended"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"storefront": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            "categories": {
                  Row: {
                    "description": string | null,"id": string | null,"image_asset_id": string | null,"name": string | null,"parent_id": string | null,"position": number | null,"slug": string | null,"store_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "categories_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "categories_store_id_image_asset_id_fkey"
      columns: ["store_id","image_asset_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["store_id","id"]
    },{
      foreignKeyName: "categories_store_id_parent_id_fkey"
      columns: ["store_id","parent_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["store_id","id"]
    }
                  ]
                },"domains": {
                  Row: {
                    "hostname": string | null,"is_primary": boolean | null,"kind": Database["public"]['Enums']["domain_kind"] | null,"store_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "store_domains_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"media": {
                  Row: {
                    "alt_text": string | null,"height": number | null,"id": string | null,"kind": Database["public"]['Enums']["asset_kind"] | null,"mime_type": string | null,"path": string | null,"store_id": string | null,"width": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "media_assets_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"pages": {
                  Row: {
                    "blocks": Json | null,"id": string | null,"kind": Database["public"]['Enums']["page_kind"] | null,"nav_position": number | null,"published_at": string | null,"seo": Json | null,"show_in_nav": boolean | null,"slug": string | null,"store_id": string | null,"title": string | null,"version": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "pages_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"payment_methods": {
                  Row: {
                    "display_name": string | null,"id": string | null,"instructions": Json | null,"method_key": string | null,"position": number | null,"provider": Database["public"]['Enums']["payment_provider"] | null,"store_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "store_payment_methods_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"product_images": {
                  Row: {
                    "alt_text": string | null,"asset_id": string | null,"height": number | null,"path": string | null,"position": number | null,"product_id": string | null,"store_id": string | null,"width": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "product_images_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_images_store_id_product_id_fkey"
      columns: ["store_id","product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["store_id","id"]
    }
                  ]
                },"products": {
                  Row: {
                    "category_id": string | null,"created_at": string | null,"description": string | null,"id": string | null,"is_featured": boolean | null,"name": string | null,"search": unknown,"seo": Json | null,"slug": string | null,"store_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "products_store_id_category_id_fkey"
      columns: ["store_id","category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["store_id","id"]
    },{
      foreignKeyName: "products_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"shipping_methods": {
                  Row: {
                    "description": string | null,"free_over_amount": number | null,"id": string | null,"kind": Database["public"]['Enums']["shipping_kind"] | null,"name": string | null,"position": number | null,"price_amount": number | null,"store_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "shipping_methods_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"stores": {
                  Row: {
                    "contact": Json | null,"country_code": string | null,"currency": string | null,"default_locale": string | null,"id": string | null,"logo_asset_id": string | null,"name": string | null,"published_at": string | null,"slug": string | null,"theme": Json | null,"timezone": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "contact"?: Json | null,"country_code"?: string | null,"currency"?: string | null,"default_locale"?: string | null,"id"?: string | null,"logo_asset_id"?: string | null,"name"?: string | null,"published_at"?: string | null,"slug"?: string | null,"theme"?: Json | null,"timezone"?: string | null
                         }
                        Update: {
                           "contact"?: Json | null,"country_code"?: string | null,"currency"?: string | null,"default_locale"?: string | null,"id"?: string | null,"logo_asset_id"?: string | null,"name"?: string | null,"published_at"?: string | null,"slug"?: string | null,"theme"?: Json | null,"timezone"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "stores_logo_asset_fk"
      columns: ["id","logo_asset_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["store_id","id"]
    }
                  ]
                },"variants": {
                  Row: {
                    "available_quantity": number | null,"compare_at_amount": number | null,"id": string | null,"is_available": boolean | null,"is_default": boolean | null,"options": Json | null,"position": number | null,"price_amount": number | null,"product_id": string | null,"sku": string | null,"store_id": string | null,"title": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "product_variants_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_variants_store_id_product_id_fkey"
      columns: ["store_id","product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["store_id","id"]
    }
                  ]
                }
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "asset_kind": ["image", "video", "document"],"asset_source": ["upload", "ai"],"domain_kind": ["subdomain", "custom"],"member_role": ["owner", "staff"],"order_status": ["pending_payment", "paid", "preparing", "ready_for_pickup", "shipped", "delivered", "cancelled", "refunded"],"page_kind": ["home", "custom", "about", "contact", "faq", "legal"],"payment_provider": ["mercadopago", "manual", "stripe", "paypal"],"payment_status": ["pending", "in_review", "approved", "rejected", "cancelled", "refunded"],"product_status": ["draft", "active", "archived"],"reservation_status": ["active", "committed", "released"],"shipping_kind": ["pickup", "flat_rate", "local_delivery"],"stock_reason": ["sale", "restock", "adjustment", "return", "initial"],"store_status": ["draft", "published", "suspended"]
          }
        },"storefront": {
          Enums: {
            
          }
        }
} as const
