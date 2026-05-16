# CSV import updates existing Leads without duplicates

The AI demo pipeline must not create duplicate Leads during CSV import. A Google `place_id` is the primary identity for imported leads; when it is missing, normalized business name plus city is the fallback identity. Re-importing an existing lead updates source/import fields, but must not overwrite human workflow fields such as notes, pipeline status, sales status, do-not-contact fields, demo creation approval, final approval, or outreach state.
