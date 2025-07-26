### 📌 Issue: Add Shared Period Metrics Module

#### Overview

Create a shared module to calculate and store summary metrics for a given time period. This will provide insight into user mood, activity, and engagement patterns during **journal summaries** and **experiments**.

---

### ✅ Goals

#### 1. **Generate Metrics**

Build a reusable function that accepts a `startDate` and `endDate` and returns the following structure:

```ts
type PeriodMetrics = {
  startDate: string,
  endDate: string,
  totalXp: number,
  avgDayRating: number,
  toneTagCounts: Record<string, number>,
  mostCommonTone?: string,
  daysLogged: number,
  tasksCompleted: number,
  averageTasksPerDay: number,
  xpByStat: Record<string, number>,
  logStreak?: { longest: number, current: number }
}
```

---

#### 2. **Auto-Generate on Completion**

* When a journal summary or experiment is **marked complete**, the system should automatically generate and save the associated metrics. 

---

#### 3. **Persist Metrics to Database**

* Store results in a `metrics_summaries` table.
* Schema should include:

  * `id`
  * `userId`
  * `type: "journal" | "experiment"`
  * `sourceId` (journalSummaryId or experimentId)
  * `startDate`
  * `endDate`
  * `createdAt`, `updatedAt`

* Schema should also include all fields from `PeriodMetrics`
---

#### 4. **Filterable Metrics Page**

Create a new UI page:

* Allows sorting and filtering by:

  * Type (`journal` or `experiment`)
  * Average day rating
  * Most common tone
  * Total XP
  * Streaks
* Useful for identifying the most impactful periods (e.g. “find experiments with average rating ≥ 4 and dominant tone = calm”).

---

#### 5. **Component for Displaying Metrics**

* Build a shared component (`<MetricSummary />`) that:

  * Can be rendered in compact form on **journal and experiment cards**
  * Shows full detail view in **journal or experiment details pages**
* Displays relevant data like:

  * XP
  * Day rating
  * Mood graph or tone tag counts
  * Streaks or consistency
