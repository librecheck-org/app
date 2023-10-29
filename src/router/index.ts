import { createRouter, createWebHistory } from "@ionic/vue-router";
import DefinitionsPage from "@/views/DefinitionsPage.vue";
import HomePage from "@/views/HomePage.vue";
import LoginPage from "@/views/LoginPage.vue";
import { RouteRecordRaw } from "vue-router";
import SubmissionsPage from "@/views/SubmissionsPage.vue";
import { useCurrentUserStore } from "@/stores";

const routes: Array<RouteRecordRaw> = [
    {
        path: "/",
        name: "Home",
        component: HomePage,
        children: [
            {
                path: "submissions",
                name: "Submissions",
                component: SubmissionsPage,
            },
            {
                path: "definitions",
                name: "Definitions",
                component: DefinitionsPage,
            },
        ],
    },
    {
        path: "/login",
        name: "Login",
        component: LoginPage
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

router.beforeEach(async to => {
    const currentUser = useCurrentUserStore();
    await currentUser.ensureIsInitialized();
    if (
        // Make sure the user is authenticated.
        !currentUser.isAuthenticated &&
        // Avoid an infinite redirect.
        to.name !== "Login"
    ) {
        // Redirect the user to the login page.
        return { name: "Login" };
    }
});

export default router;
