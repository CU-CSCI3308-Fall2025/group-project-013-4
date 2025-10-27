### **Team number: 13-4**

### **1\. Team Number**

You have been assigned a team number, on Canvas, that is represented as your recitation section number plus a one-digit identifier. This team number MUST appear on ALL deliverables/submissions posted by your team to your git repository and to Canvas.

### **2\. Team name**

Team name: WalletWatch 13-4

### **3\. Team Members**

List the First & Last name of team members, their GitHub usernames and their email addresses.

| Name | Github usernames | Email |
| :---- | :---- | :---- |
| Kishore Karthikeyan | Kishore90820 | kika5775@colorado.edu |
| Matt Topham | thetopham | mato4919@colorado.edu |
| Emir Simsek | emirsimsek00 | emsi3143@colorado.edu |
| Aiden Johnson | AJohnson-13 | aijo4876@colorado.edu |
| Ellie Odau | elliebell1 | elod1649@colorado.edu |
| Harrie Ha | harrieha | haha1298@colorado.edu |

### **4\. Application Name**

Application name: WalletWatch 

### **5\. Application Description**

Our finance tracker application is a personal finance and social spending platform that helps users monitor their daily expenses while engaging with friends in a fun, interactive way. The core functionality allows users to log income and expenses, categorize their transactions, and visualize their spending patterns over time. The app provides insights for users as to where their money is going and helps users set budgets and financial limits to build smarter spending habits. Along with this, users can post their daily spendings for their friends to see, creating a transparent community around personal finance. 

### **6\. Audience**

Aimed toward a college aged demographic and people that want to have an interactive way to manage their spending habits.

### **7\. Vision Statement**

To connect friends through transparency, competition, and better money habits

#### **Examples**

* **Amazon**: “To be Earth’s most customer-centric company, where customers can find and discover anything they might want to buy online.”  
* **Tesla**: “To create the most compelling car company of the 21st century by driving the world’s transition to electric vehicles.”  
* **Facebook**: “People use Facebook to stay connected with friends and family, to discover what’s going on in the world, and to share and express what matters to them.”  
* **CU Boulder**: “To be a leader in addressing the humanitarian, social, and technological challenges of the twenty-first century.”  
* **IKEA**: “To create a better everyday life for many people.”  
* **Nordstrom**: “Offer the customer the best possible service, selection,quality, and value.”  
* **Google**: “To provide access to the world’s information in one click.”

### **8\. Version Control**

**info**

You are required to create a **public** GitHub repository and add all the members of the team to it. Share the link to this repository in this document.

This repository should have the following folders:

* **TeamMeetingLogs** \- The minutes of the meeting with your TA every week will be recorded in a file here. You will be updating the same file every week with the latest updates. Points to include in the minutes would be:  
  * Decisions made  
  * Alternative actions/options discussed  
  * Follow-up items, including agreed-on roles and responsibilities  
* **MilestoneSubmissions** \- All course-related documents, including this one, will be stored in this folder.  
* **ProjectSourceCode** \- The source code and all relevant project documentation for the application will be stored in this folder.  
* **ReadMe.md** \- Refer to the [**project guide**](https://cuboulder-csci3308.pages.dev/docs/project#readmemd) for more information on this.  
  * For a detailed view of your repository, refer to the [**project guide**](https://cuboulder-csci3308.pages.dev/docs/project#recommended-directory-structure)  
* **.gitignore** \- Please remember to create a .gitignore file in your "ProjectSourceCode" folder in the repository

### **9\. Development Methodology**

We will be using a scrum based agile approach with short, iterative sprints. Each week will focus on specific deliverables that build towards our final product, WalletWatch. 

Week 1 \- Planning & Set Up (Sprint 1\)

* Define project goals, roles and responsibilities  
* Finalize core features and user stories (expense tracking, daily spending posts, whatever else)  
* Design low fidelity wireframes and UI mockups  
* Set up development environment, version control, and Kanban board  
* Establish database schema and backend structure  
* General wireframes

Week 2– Core functionality and implementation (Sprint 2\) 

* Implement user authentication and profile creation  
* Build income and expense logging functionality  
* Develop database connections and CRUD operations  
* Begin frontend integration for logging and viewing transactions  
* COnduct first round of internal on core features

Week 3- Social & interactive features

* Implement BeReal style daily spending posts and public feed  
* Add leaderboard/ranking system to show top spenders and savers  
* Develop notifications or prompts for daily spending posts  
* Conduct user interface refinements and usability testing  
* Fix bugs

Week 4- Polishing & final delivery

* Refine UI/UX design for consistency and responsiveness  
* Optimize database queries for performance  
* Conduct final testing and debugging  
* Prepare project documentation

### **10\. Communication Plan**

We plan to communicate about project specifics through our group discord and plan meetings and other logistics through an I-message group chat.

### **11\. Meeting Plan**

* **Team Meeting**: Identify the day(s) and time(s), mode, and location your team has agreed upon for regular meetings. “Modality” refers to how you are meeting (face-to-face), group video chat (like Zoom, Google Meet), etc.

Time: Mondays 4:30-5:30 

Place: Norlin Library 

Modality: In person

* **Weekly meeting with TA**: You will also mention the meeting day, time and location (physical or online) for the weekly meeting with your TA here.  
  * Please refer to [**these instructions**](https://cuboulder-csci3308.pages.dev/docs/project#weekly-meetings-with-ta) for expectations in your weekly meeting with your TAs. Do read the entire section carefully.

Time: Thursday 12:45-1PM

Place: [https://cuboulder.zoom.us/j/92836822573](https://cuboulder.zoom.us/j/92836822573) 

Modality: Virtual

### **12\. Use Case Diagram \- Uploaded in Milestone**

Create a high-level Use Case Diagram for your application. Your diagram must show at least 6 key features of your application.

This activity should help you identify the end users of the application and the ways they would interact with the system. You can reference the examples covered in class. This will also help you scope out the features of your application. You can refer to [**this page**](https://www.lucidchart.com/pages/uml-use-case-diagram) for more information on how to create a Use Case Diagram.

### **13\. Wireframes**

You will create wireframes for each page of the application.

Wireframes are low-fidelity visual representations of the user interface of your application. They are used to plan the layout of the application and to communicate the flow of the application to the team. You can use any tool of your choice to create the wireframes. Hand sketched wireframes are also acceptable. You can refer to [**this**](https://balsamiq.com/learn/articles/what-are-wireframes/) for more information on why and how to create wireframes.

## **Extra Credit**

Identify at least five potential risks related to your project. For each risk, describe its severity and outline suitable mitigation strategies to address it.

1. **Scope creep (Plaid API integrations)** — *High*. **Mitigation:** lock v1 to manual logging; log API responses to DB if later added.

2. **Data privacy (social sharing)** — *Medium*. **Mitigation:** default private; explicit opt-in for leaderboard, groups, and posts.

3. **Deployment/infra drift** — *Medium*. **Mitigation:** use provided Docker compose; document env vars.

4. **Team coordination** — *Medium*. **Mitigation:** GitHub project board, feature branches, PR reviews.

5. **DB design mistakes** — *Medium*. **Mitigation:** start simple schema (users, transactions, categories, budgets, posts, groups), add migrations incrementally.

