// _common/supabase/supabase.provider.ts
import { createClient } from '@supabase/supabase-js';
import { Provider } from '@nestjs/common';

export const SupabaseProvider: Provider = {
    provide: 'SUPABASE',
    useFactory: () => {
        return createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!  // service role, RLS'i bypass eder
        );
    },
};