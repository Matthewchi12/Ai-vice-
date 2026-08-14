 // ======================================
// SUPABASE
// ======================================

const SUPABASE_URL =
    "https://ihoxjwqlvuskkqrfowbr.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_TAesDbD1gUQ5p9IoYhZWJw_tBHL5g4F";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ======================================
// LOGIN ELEMENTS
// ======================================

const authScreen =
    document.getElementById("authScreen");

const app =
    document.getElementById("app");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginButton =
    document.getElementById("loginButton");

const signupButton =
    document.getElementById("signupButton");

const authStatus =
    document.getElementById("authStatus");


// ======================================
// SIGN UP
// ======================================

signupButton.addEventListener(
    "click",
    async () => {

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;

        if (!email || !password) {

            authStatus.textContent =
                "Please enter your email and password.";

            return;
        }

        if (password.length < 6) {

            authStatus.textContent =
                "Password must be at least 6 characters.";

            return;
        }

        authStatus.textContent =
            "Creating account...";

        const { error } =
            await supabaseClient.auth.signUp({
                email: email,
                password: password
            });

        if (error) {

            authStatus.textContent =
                error.message;

            return;
        }

        authStatus.textContent =
            "Account created! Check your email to confirm your account.";
    }
);


// ======================================
// LOGIN
// ======================================

loginButton.addEventListener(
    "click",
    async () => {

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;

        if (!email || !password) {

            authStatus.textContent =
                "Please enter your email and password.";

            return;
        }

        authStatus.textContent =
            "Logging in...";

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {

            authStatus.textContent =
                error.message;

            return;
        }

        authStatus.textContent =
            "Login successful!";

        authScreen.style.display =
            "none";

        app.style.display =
            "block";
    }
);


// ======================================
// CHECK EXISTING LOGIN
// ======================================

async function checkLogin() {

    const { data } =
        await supabaseClient.auth.getSession();

    if (data.session) {

        authScreen.style.display =
            "none";

        app.style.display =
            "block";
    }
}

checkLogin();


// ======================================
// YOUR RENDER BACKEND
// ======================================
