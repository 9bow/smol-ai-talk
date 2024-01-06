/**
 * REALTIME SUBSCRIPTIONS
 * Setup realtime listening on chats, products and prices tables
 */
drop publication if exists supabase_realtime;
create publication supabase_realtime for table chats, products, prices;