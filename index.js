 // ======================================
// PAYSTACK SUBSCRIPTIONS
// ======================================

// Paystack TEST public key
const PAYSTACK_PUBLIC_KEY =
    "pk_test_238b10087d6e116590057be181d1f6af5849d32e";


// ======================================
// PAYSTACK PLAN CODES
// ======================================

const PAYSTACK_PLANS = {

    basic:
        "PLN_77evy40w37571js",

    standard:
        "PLN_2klvnxb9r1exmhi",

    pro:
        "PLN_g3m0doyhzmgp4y7"

};


// ======================================
// PAYMENT STATUS
// ======================================

const paymentStatus =
    document.getElementById("paymentStatus");


// ======================================
// GET CURRENT USER
// ======================================

async function getCurrentUser() {

    const { data, error } =
        await supabaseClient.auth.getUser();

    if (error) {

        console.error(
            "User error:",
            error
        );

        return null;

    }

    return data.user;

}


// ======================================
// START PAYSTACK SUBSCRIPTION
// ======================================

async function startPaystackPayment(
    planCode
) {

    try {

        // Make sure Paystack loaded
        if (typeof PaystackPop === "undefined") {

            paymentStatus.textContent =
                "❌ Paystack could not load. Please refresh the page.";

            return;

        }


        // Get logged-in Supabase user
        const user =
            await getCurrentUser();


        if (!user) {

            paymentStatus.textContent =
                "❌ Please login before subscribing.";

            return;

        }


        // Make sure user has an email
        if (!user.email) {

            paymentStatus.textContent =
                "❌ Your account does not have an email address.";

            return;

        }


        paymentStatus.textContent =
            "Opening secure payment...";


        // Create Paystack checkout
        const popup =
            new PaystackPop();


        popup.resumeTransaction(
            ""
        );

    }

    catch (error) {

        console.error(
            "Paystack error:",
            error
        );

        paymentStatus.textContent =
            "❌ Unable to open payment.";

    }

}
