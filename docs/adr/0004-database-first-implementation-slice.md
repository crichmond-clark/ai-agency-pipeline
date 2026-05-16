# Database-first implementation slice

The first implementation slice starts with the database schema, Supabase integration, and basic lead dashboard before building the demo renderer. This makes the pipeline's state model explicit early, aligns implementation with the domain language, and avoids building UI/demo components against throwaway fixtures that later need to be reshaped around persistence.
