3. Audits
     From user:
      - auditRatio
      - totalUp
      - totalDown
      - totalUpBonus

     Your audit ratio is around 0.905, so display maybe 0.91.

  4. Skills
     From user.skills:
     You have 15 skills:
      - prog: 85
      - go: 45
      - front-end: 40
      - js/html/back-end/algo: 35
      - etc.

     This is very good for a visual section.

  5. Progress / Projects
     From:
      - latestProgressByPath
      - progresses
      - results
      - passedResults
      - failedResults

     Show:
      - completed projects count
      - failed/unfinished count
      - latest completed work
      - pass/fail ratio

  Best Graphs To Build

  For the mandatory SVG graphs, I recommend:

  1. XP Over Time
     Use xpTransactions.
      - x-axis: createdAt
      - y-axis: cumulative XP
      - graph type: SVG line chart

     This is probably your strongest graph.

  2. Skills Bar Chart
     Use user.skills.
      - x-axis: skill names
      - y-axis: amount
      - graph type: SVG bar chart

     This is easier than pass/fail and visually clear.

  Optional third graph:

  3. Pass/Fail Ratio
     Use:
      - passedResults.aggregate.count
      - failedResults.aggregate.count

     Graph type: SVG donut chart or two-bar chart.