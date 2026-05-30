Task

Implement a simple version of the Resource Allocator from this diagram. The Resource Allocator is a system that transforms the recommendations from Elyx’s HealthSpan AI into daily, weekly, monthly or yearly tasks. It also coordinates with other AI agents or humans or resources to adapt the plan based on their availability.
. 
 


The resource allocator takes in an action plan - which is a list of activities, ordered by priority (The priority is based on what is most important to their health). Each action in the list can be one of the following subtypes:
Activity Type that needs to be done  [eg. Run, Eat supplement, do a test]
How often does this activity need to be done [ 3 times a week]
Details about the activity [eg. Maintain HR between 120-140]
Who will facilitate the activity (eg. trainer)
Where can this activity be done?
Whether the activity can be facilitated done remotely (ie. by the training talking through a video call)
What prep needs to be done to facilitate this activity (eg. Food needs to be cooked)
A list of backup activities that can be used to substitute for this activity
Adjustments that need to be done if an activity is skipped.
Metrics to be collected from this activity.
An activity can be one of the following (as specified in the Activity Type field)
Fitness routine / exercise (including things like eye exercise)
Food consumption
Medication consumption
Therapy (sauna /  ice bath)
Consultation
The rest of the nodes (equipment / specialist etc) should be self explanatory - they refer to constraints. 
Travel Plans: Members may have scheduled travel commitments, which could impact their availability.
Equipment: Certain equipment may not always be accessible. A schedule should be in place to track its availability.
Specialists: The availability of specialists should be clearly outlined to ensure proper coordination.
Allied Health: Includes healthcare professionals who support patient care but are not medical doctors, such as physiotherapists, occupational therapists, dietitians, and speech therapists. Their schedules should also be tracked to ensure seamless patient care and team coordination.


Your task is to:
Generate realistic sample test data in the form of csv / json for at least 100 activities. 
Generate realistic availability data (in csv / json) for the other nodes for 3 months
Write a simple scheduler that will take in both the action plan, and the schedules and output a personalised plan.
There is no need to build a nice UI - but do output the personalized plan in some kind of calendar format that is readable. 
Host the app on the internet. Note that submission won’t be reviewed if the app is not hosted. 
Provide a github link and prompts used for the project if any.

