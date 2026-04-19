# Project Architecture & Dependency Graph

## 🗺️ High-Level Navigation & Auth Flow
```mermaid
graph TD
    App[App.tsx] --> AuthProvider[AuthContext]
    App --> ToastProvider[ToastContext]
    App --> PaperProvider[UI Theme]
    App --> RootNav[RootNavigator]

    RootNav -- Unauthenticated --> Login[LoginScreen]
    RootNav -- Authenticated & Setup Required --> ForceUpdate[ForceUpdateProfileScreen]
    
    RootNav -- Admin Role --> AdminTabs[AdminTabs]
    RootNav -- Student Role --> StudentTabs[StudentTabs]

    subgraph Admin_Portal [Admin Portal]
        AdminTabs --> AdminDash[AdminDashboard]
        AdminTabs --> TaskMan[TaskManager]
        AdminTabs --> Verif[Verification]
        AdminTabs --> AdminSettings[Settings]
    end

    subgraph Student_Portal [Student Portal]
        StudentTabs --> Home[Home]
        StudentTabs --> Leaderboard[Leaderboard]
        StudentTabs --> Profile[Profile]
        StudentTabs --> Quests[QuestsStack]
        Quests --> Tasks[Tasks List]
        Quests --> TaskDetail[Task Detail]
    end
```

## 🛠️ Service & Data Layer
```mermaid
graph LR
    subgraph UI_Layer [Screens & Components]
        Home
        Tasks
        AdminDash
    end

    subgraph Logic_Layer [Hooks & Contexts]
        useAuth
        useUser
        AuthContext
    end

    subgraph Data_Layer [Services]
        S_Auth[auth.ts]
        S_Tasks[tasks.ts]
        S_Users[users.ts]
        S_Sub[submissions.ts]
    end

    subgraph Infrastructure [Firebase]
        FB_Auth[Authentication]
        FB_FS[Firestore]
        FB_ST[Storage]
        FB_CF[Cloud Functions]
    end

    UI_Layer --> Logic_Layer
    Logic_Layer --> Data_Layer
    Data_Layer --> Infrastructure
    FB_FS --> FB_CF
```

## 📁 Directory Structure Overview
- **`src/`**: Primary application source.
    - **`components/`**: Reusable UI elements (Buttons, Cards, Modals).
    - **`services/`**: Firebase API wrappers and business logic.
    - **`screens/`**: Feature-specific views divided by user role.
    - **`navigation/`**: Routing configuration.
- **`functions/`**: Server-side logic (TypeScript).
- **`myApp/`**: Independent Expo Router prototype.
