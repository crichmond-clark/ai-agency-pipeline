# Separate pipeline and sales status

Leads use separate Pipeline Status and Sales Status fields instead of one overloaded status field. Demo production and sales outcomes are different state machines, so separating them avoids invalid combinations such as `qa_failed` competing with `replied`, keeps dashboard filters clearer, and lets a lead remain production-approved while its commercial outcome changes.
