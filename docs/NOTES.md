# To Do

1. Make the session persistent when reloading the page.

2. Add a Skills section.
   - Use `user.skills`.
   - Display the student's skill names and values.
   - Add an SVG bar chart with skill names on the x-axis and amounts on the y-axis.

3. Add a Progress / Projects section.
   - Use `latestProgressByPath`, `progresses`, and `results`.
   - Display completed project count.
   - Display failed or unfinished project count.
   - Display the latest completed work.

4. Add a pass/fail visualization.
   - Use `passedResults.aggregate.count` and `failedResults.aggregate.count`.
   - Display the values as an SVG donut chart or two-bar chart.
