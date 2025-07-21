# Bachelor Project: "Exploring Avant-Garde: Visualizing Clusters of Exhibited Artists"
## Preview on developed Tool
![Overview](https://github.com/user-attachments/assets/98f75163-a93e-46cc-8891-ea582345dfd3)


## Setup Instructions

This guide provides step-by-step instructions for setting up and running the project.

### 1. Install Node.js
1. Download and install Node.js from the [official website](https://nodejs.org/en/download/).
2. Follow the installation instructions for your operating system.

### 2. Install Angular CLI
1. Open a command prompt or terminal.
2. Run the following command to install Angular CLI:
   ```bash
   npm install -g @angular/cli@17

### 3. Install Neo4j Desktop
1. Download and install Neo4j Desktop (version 1.5.X) from the [official website](https://neo4j.com/download/](https://neo4j.com/deployment-center/#desktop)).
2. Open Neo4j Desktop and create a new project.
3. Click on the project and select "Reveal files in explorer" to open the project folder.
4. Copy the `artvis-db.dump` file into the revealed folder.
5. In Neo4j Desktop, ensure the `artvis-db.dump` file is visible.
6. Click on the three dots (options) next to the `artvis-db.dump` file and choose "Create new DBMS from dump".
7. Configure the new DBMS with the following settings:
   - **Name**: `artvis-db`
   - **Password**: `24032102`
   - **Version**: `4.4.5`
8. Run the database by clicking the play button.

### 4. Install Required npm Modules
#### Frontend
1. Open a terminal and navigate to the `frontend` folder.
2. Run the following command to install the necessary npm modules:
   ```bash
   npm install
#### Backend
1. Open a terminal and navigate to the backend folder.
2. Run the following command to install the necessary npm module
    ```bash
   npm install

### 5. Obtain the `.env` File
The `.env` file contains essential configuration details required to run the project (e.g., API keys, sensitive environment variables). This file is **not included** in the repository for security reasons.

1. **Request the `.env` File:**
   - To obtain the `.env` file, please contact me directly at luisamueller02@web.de.

2. **Add the `.env` File:**
   - Once you receive the file, place it in the appropriate directory:
     - **Backend:** Place the `.env` file in the `backend` folder.


## How to Run the Project after Setup

1. Open two terminals:
   - One in the `frontend` folder.
   - One in the `backend` folder.
2. In the both terminals, run:
   ```bash
   npm start
3. Open your web browser and navigate to http://localhost:4200 to access the website.

