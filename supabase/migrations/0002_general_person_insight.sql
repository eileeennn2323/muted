-- Adds a "general" person_insights type — observational understanding of how
-- a person tends to operate, for notes that don't fit the four
-- action-oriented types (cares_about / communication / likely_questions / avoid).
-- approach stays a fifth, separate type used for the Suggested Approach section.

alter table person_insights drop constraint person_insights_type_check;

alter table person_insights add constraint person_insights_type_check
  check (
    type in (
      'cares_about',
      'communication',
      'likely_questions',
      'avoid',
      'approach',
      'general'
    )
  );
