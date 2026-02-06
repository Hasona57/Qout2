# Row Level Security (RLS) Setup Guide

This guide explains how to enable Row Level Security (RLS) for all tables in your Supabase database to fix security warnings.

## Problem

Supabase Database Linter shows errors for all tables that are exposed via PostgREST but don't have RLS enabled. This is a security concern as it means anyone with API access could potentially read/write data without restrictions.

## Solution

Run the SQL script `enable_rls.sql` in your Supabase SQL Editor to:
1. Enable RLS on all public tables
2. Create policies that allow service role access (for API routes)

## Steps to Enable RLS

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**

2. **Run the SQL Script**
   - Open the SQL Editor
   - Copy the contents of `database/enable_rls.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute

3. **Verify RLS is Enabled**
   - Go to **Database** → **Tables**
   - Select any table
   - Check that "Row Level Security" is enabled
   - You should see policies listed

## Important Notes

### Service Role Access
- The script creates policies that allow full access for service role
- Your Next.js API routes use the service role key, so they will continue to work
- The service role key bypasses RLS, but having policies helps with documentation

### Public Read Access
- Some tables (products, categories, sizes, colors, etc.) have public read policies
- This allows the store frontend to read product data without authentication
- Write operations still require service role or proper authentication

### Production Considerations
- For production, you may want to add more restrictive policies
- Consider user-based policies for tables like `orders`, `users`, `addresses`
- Review each policy to ensure it matches your security requirements

## Tables with RLS Enabled

The script enables RLS on all these tables:
- expenses
- audit_logs
- attachments
- users
- addresses
- roles
- delivery_zones
- shipping_rates
- courier_companies
- products
- product_images
- categories
- product_variants
- sizes
- colors
- invoices
- invoice_items
- payments
- payment_methods
- stock_locations
- orders
- order_items
- shipments
- returns
- return_items
- commission_records
- notifications
- stock_items
- stock_transfers
- stock_transfer_items
- stock_adjustments
- stock_adjustment_items
- carts
- cart_items
- role_permissions
- permissions

## Troubleshooting

### If API routes stop working:
- Check that service role policies are created
- Verify you're using the service role key in API routes
- Check Supabase logs for RLS policy violations

### If store frontend can't read products:
- Verify public read policies are created for product-related tables
- Check that policies use `USING (true)` for SELECT operations

### To disable RLS (not recommended):
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

## Security Best Practices

1. **Never disable RLS** - Always keep it enabled
2. **Review policies regularly** - Ensure they match your access requirements
3. **Use service role carefully** - Only in server-side API routes
4. **Add user-specific policies** - For user data, add policies that check user ID
5. **Test thoroughly** - After enabling RLS, test all API endpoints

## Next Steps

After enabling RLS:
1. Test all API endpoints to ensure they still work
2. Check Supabase Database Linter - errors should be resolved
3. Review and customize policies based on your needs
4. Add user-specific policies for sensitive data







