const menuBtn = document.getElementById("menuBtn");
const nav = document.querySelector(".navbar nav");

menuBtn.addEventListener("click", () => {
    nav.classList.toggle("active");
});

document.querySelectorAll(".navbar nav a").forEach(link => {
    link.addEventListener("click", () => {
        nav.classList.remove("active");
    });
});


/* =========================================
   RABBA NOIR ORDER + RAZORPAY SYSTEM
========================================= */

const orderModal = document.getElementById("orderModal");
const orderForm = document.getElementById("orderForm");
const selectedProduct = document.getElementById("selectedProduct");
const orderMessage = document.getElementById("orderMessage");


/* GOOGLE APPS SCRIPT URL */

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxr4k6kjPznbMaCbtfZKcVJihCaF1qfj88X7X0DaWOKMM52KlcKNw1x0p_tDwH_gJkz/exec";


let currentProduct = "";


/* =========================================
   OPEN ORDER FORM
========================================= */

function openOrderForm(product) {

    currentProduct = product;

    selectedProduct.textContent = product;

    orderModal.classList.add("active");

    document.body.style.overflow = "hidden";
}


/* =========================================
   CLOSE ORDER FORM
========================================= */

function closeOrderForm() {

    orderModal.classList.remove("active");

    document.body.style.overflow = "";

    orderMessage.innerHTML = "";
}


/* =========================================
   LOAD RAZORPAY
========================================= */

function loadRazorpay() {

    return new Promise((resolve, reject) => {

        if (window.Razorpay) {
            resolve();
            return;
        }

        const script = document.createElement("script");

        script.src = "https://checkout.razorpay.com/v1/checkout.js";

        script.onload = resolve;

        script.onerror = () => {
            reject(new Error("Razorpay failed to load."));
        };

        document.body.appendChild(script);
    });
}


/* =========================================
   SUBMIT ORDER
========================================= */

orderForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    const name =
        document.getElementById("customerName").value.trim();

    const phone =
        document.getElementById("customerPhone").value.trim();

    const quantity =
        Number(document.getElementById("quantity").value);

    const address =
        document.getElementById("customerAddress").value.trim();


    if (phone.length !== 10) {

        alert("Please enter a valid 10-digit mobile number.");

        return;
    }


    if (!name || !address || quantity < 1) {

        alert("Please fill all the required details.");

        return;
    }


    const submitButton =
        document.querySelector(".submit-order");


    submitButton.disabled = true;

    submitButton.textContent = "STARTING PAYMENT...";


    try {

        /* LOAD RAZORPAY */

        await loadRazorpay();


        /* CREATE PAYMENT ORDER */

        const response = await fetch(
            GOOGLE_SCRIPT_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body: JSON.stringify({

                    action: "createPaymentOrder",

                    name: name,

                    phone: phone,

                    product: currentProduct,

                    quantity: quantity,

                    address: address

                })
            }
        );


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.error ||
                "Unable to create payment."
            );

        }


        /* =====================================
           OPEN RAZORPAY CHECKOUT
        ===================================== */

        const options = {

            key: result.keyId,

            amount: result.amount,

            currency: result.currency,

            name: "Rabba Noir",

            description:
                currentProduct +
                " × " +
                quantity,

            order_id:
                result.razorpayOrderId,


            prefill: {

                name: name,

                contact: phone

            },


            notes: {

                product: currentProduct,

                quantity: quantity

            },


            theme: {

                color: "#111111"

            },


            handler: async function (paymentResponse) {

                submitButton.textContent =
                    "VERIFYING PAYMENT...";


                try {

                    /* ==============================
                       VERIFY PAYMENT
                    ============================== */

                    const verifyResponse =
                        await fetch(
                            GOOGLE_SCRIPT_URL,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "text/plain;charset=utf-8"
                                },

                                body: JSON.stringify({

                                    action:
                                        "verifyPayment",

                                    razorpay_order_id:
                                        paymentResponse
                                            .razorpay_order_id,

                                    razorpay_payment_id:
                                        paymentResponse
                                            .razorpay_payment_id,

                                    razorpay_signature:
                                        paymentResponse
                                            .razorpay_signature

                                })
                            }
                        );


                    const verifyResult =
                        await verifyResponse.json();


                    if (!verifyResult.success) {

                        throw new Error(
                            verifyResult.error ||
                            "Payment verification failed."
                        );

                    }


                    /* ==============================
                       SUCCESS
                    ============================== */

                    orderForm.reset();

                    orderMessage.innerHTML = `

                        <div class="success-message">

                            <div class="success-icon">
                                ✓
                            </div>

                            <h3>
                                Payment Successful!
                            </h3>

                            <p>
                                Thank you for ordering
                                from Rabba Noir.
                            </p>

                            <p>
                                Order ID:
                                <strong>
                                    ${verifyResult.orderId}
                                </strong>
                            </p>

                            <p>
                                Your order has been
                                confirmed.
                            </p>

                        </div>

                    `;


                } catch (error) {

                    orderMessage.innerHTML = `

                        <div class="error-message">

                            Payment was received, but
                            verification could not be
                            completed automatically.

                            Please contact Rabba Noir
                            support.

                        </div>

                    `;

                }


                submitButton.disabled = false;

                submitButton.textContent =
                    "PLACE ORDER";

            },


            modal: {

                ondismiss: function () {

                    submitButton.disabled = false;

                    submitButton.textContent =
                        "PLACE ORDER";

                }

            }

        };


        const razorpay =
            new Razorpay(options);


        razorpay.on(
            "payment.failed",
            function () {

                orderMessage.innerHTML = `

                    <div class="error-message">

                        Payment failed or was cancelled.
                        Please try again.

                    </div>

                `;

                submitButton.disabled = false;

                submitButton.textContent =
                    "PLACE ORDER";

            }
        );


        razorpay.open();


    } catch (error) {

        console.error(error);


        orderMessage.innerHTML = `

            <div class="error-message">

                ${error.message ||
                "Something went wrong. Please try again."}

            </div>

        `;


        submitButton.disabled = false;

        submitButton.textContent =
            "PLACE ORDER";

    }

});