const menuBtn = document.getElementById("menuBtn");
const nav = document.querySelector(".navbar nav");

if (menuBtn && nav) {

    menuBtn.addEventListener("click", () => {
        nav.classList.toggle("active");
    });

    document.querySelectorAll(".navbar nav a").forEach(link => {

        link.addEventListener("click", () => {
            nav.classList.remove("active");
        });

    });

}


/* =========================================
   RABBA NOIR ORDER + RAZORPAY SYSTEM
========================================= */

const orderModal = document.getElementById("orderModal");
const orderForm = document.getElementById("orderForm");
const selectedProduct = document.getElementById("selectedProduct");
const orderMessage = document.getElementById("orderMessage");


/* =========================================
   GOOGLE APPS SCRIPT URL
========================================= */

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxr4k6kjPznbMaCbtfZKcVJihCaF1qfj88X7X0DaWOKMM52KlcKNw1x0p_tDwH_gJkz/exec";


/* =========================================
   CURRENT ORDER INFORMATION
========================================= */

let currentProduct = "";

let currentIsCombo = false;

let currentComboAttar = "";


/* =========================================
   OPEN NORMAL PRODUCT ORDER FORM
========================================= */

function openOrderForm(product) {

    currentProduct = product;

    currentIsCombo = false;

    currentComboAttar = "";

    if (selectedProduct) {
        selectedProduct.textContent = product;
    }

    if (orderModal) {
        orderModal.classList.add("active");
    }

    document.body.style.overflow = "hidden";
}


/* =========================================
   OPEN COMBO ORDER FORM
========================================= */

function openComboOrder() {

    const comboSelect =
        document.getElementById("comboAttar");

    if (!comboSelect) {

        alert("Please select an attar.");

        return;
    }


    const attar =
        comboSelect.value.trim();


    if (!attar) {

        alert("Please select an attar.");

        return;
    }


    currentComboAttar = attar;

    currentProduct =
        "Khamrah Perfume + " + attar;

    currentIsCombo = true;


    if (selectedProduct) {

        selectedProduct.textContent =
            currentProduct;

    }


    if (orderModal) {

        orderModal.classList.add("active");

    }

    document.body.style.overflow = "hidden";
}


/* =========================================
   CLOSE ORDER FORM
========================================= */

function closeOrderForm() {

    if (orderModal) {

        orderModal.classList.remove("active");

    }

    document.body.style.overflow = "";

    if (orderMessage) {

        orderMessage.innerHTML = "";

    }

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


        const script =
            document.createElement("script");


        script.src =
            "https://checkout.razorpay.com/v1/checkout.js";


        script.onload = resolve;


        script.onerror = () => {

            reject(
                new Error(
                    "Razorpay failed to load."
                )
            );

        };


        document.body.appendChild(script);

    });

}


/* =========================================
   SUBMIT ORDER
========================================= */

if (orderForm) {

    orderForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                document
                    .getElementById("customerName")
                    .value
                    .trim();


            const phone =
                document
                    .getElementById("customerPhone")
                    .value
                    .trim();


            const quantity =
                Number(
                    document
                        .getElementById("quantity")
                        .value
                );


            const address =
                document
                    .getElementById("customerAddress")
                    .value
                    .trim();


            /* =================================
               BASIC VALIDATION
            ================================= */

            if (phone.length !== 10) {

                alert(
                    "Please enter a valid 10-digit mobile number."
                );

                return;
            }


            if (
                !name ||
                !address ||
                quantity < 1
            ) {

                alert(
                    "Please fill all the required details."
                );

                return;
            }


            /* =================================
               COMBO VALIDATION
            ================================= */

            if (
                currentIsCombo &&
                !currentComboAttar
            ) {

                alert(
                    "Please select an attar for the combo."
                );

                return;
            }


            const submitButton =
                document.querySelector(
                    ".submit-order"
                );


            if (!submitButton) {

                alert(
                    "Order button could not be found."
                );

                return;
            }


            submitButton.disabled = true;

            submitButton.textContent =
                "STARTING PAYMENT...";


            try {

                await loadRazorpay();


                /* =================================
                   CREATE PAYMENT ORDER
                ================================= */

                const response =
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
                                    "createPaymentOrder",

                                name:
                                    name,

                                phone:
                                    phone,

                                product:
                                    currentProduct,

                                quantity:
                                    quantity,

                                address:
                                    address,

                                isCombo:
                                    currentIsCombo,

                                selectedAttar:
                                    currentComboAttar

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


                /* =================================
                   RAZORPAY CHECKOUT
                ================================= */

                const options = {

                    key:
                        result.keyId,

                    amount:
                        result.amount,

                    currency:
                        result.currency,

                    name:
                        "Rabba Noir",

                    description:
                        currentProduct +
                        " × " +
                        quantity,

                    order_id:
                        result.razorpayOrderId,

                    prefill: {

                        name:
                            name,

                        contact:
                            phone

                    },

                    notes: {

                        product:
                            currentProduct,

                        quantity:
                            quantity,

                        combo:
                            currentIsCombo
                                ? "Yes"
                                : "No",

                        selectedAttar:
                            currentComboAttar

                    },

                    theme: {

                        color:
                            "#111111"

                    },


                    /* =================================
                       PAYMENT SUCCESS
                    ================================= */

                    handler:
                        async function (
                            paymentResponse
                        ) {

                            submitButton.textContent =
                                "VERIFYING PAYMENT...";


                            try {

                                const verifyResponse =
                                    await fetch(
                                        GOOGLE_SCRIPT_URL,
                                        {
                                            method:
                                                "POST",

                                            headers: {
                                                "Content-Type":
                                                    "text/plain;charset=utf-8"
                                            },

                                            body:
                                                JSON.stringify({

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


                                if (
                                    !verifyResult.success
                                ) {

                                    throw new Error(
                                        verifyResult.error ||
                                        "Payment verification failed."
                                    );

                                }


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

                                console.error(
                                    "Verification Error:",
                                    error
                                );


                                orderMessage.innerHTML = `

                                    <div class="error-message">

                                        Payment was received,
                                        but verification could
                                        not be completed
                                        automatically.

                                        Please contact Rabba Noir
                                        support.

                                    </div>

                                `;

                            }


                            submitButton.disabled =
                                false;

                            submitButton.textContent =
                                "PLACE ORDER";

                        },


                    /* =================================
                       CHECKOUT CLOSED
                    ================================= */

                    modal: {

                        ondismiss:
                            function () {

                                submitButton.disabled =
                                    false;

                                submitButton.textContent =
                                    "PLACE ORDER";

                            }

                    }

                };


                /* =================================
                   OPEN RAZORPAY
                ================================= */

                const razorpay =
                    new Razorpay(options);


                /* =================================
                   PAYMENT FAILED
                ================================= */

                razorpay.on(
                    "payment.failed",
                    function () {

                        orderMessage.innerHTML = `

                            <div class="error-message">

                                Payment failed or was
                                cancelled.

                                Please try again.

                            </div>

                        `;


                        submitButton.disabled =
                            false;


                        submitButton.textContent =
                            "PLACE ORDER";

                    }
                );


                razorpay.open();


            } catch (error) {

                console.error(
                    "Payment Error:",
                    error
                );


                orderMessage.innerHTML = `

                    <div class="error-message">

                        ${
                            error.message ||
                            "Something went wrong. Please try again."
                        }

                    </div>

                `;


                submitButton.disabled =
                    false;


                submitButton.textContent =
                    "PLACE ORDER";

            }

        }
    );

}