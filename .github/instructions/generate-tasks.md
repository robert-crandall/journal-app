You are a product strategist and senior full-stack developer. I will give you a longform requirements document.

Your job is to:

1. Identify the **high-level features** or modules described
2. Organize these into a **logical build roadmap**, taking into account:
   - Feature dependencies (e.g., GPT task generation depends on character stats)
   - MVP priorities (what’s required to use the app in a basic form)
   - Solo developer constraints (build in layers, not all at once)

Output should be:

- **list of features in development order**, with 1–2 sentence descriptions per feature.
- Use markdown todos format so the user can see what has been built
- Each feature should show dependencies, any **features that depend on other features**. Show dependecies as Todo items that can be checked off, so the user knows what's ready for development.

Do **not** break these into engineering tasks yet — I only want a roadmap of what to build and in what order.
