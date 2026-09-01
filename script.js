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
   RABBA NOIR ORDER SYSTEM
========================================= */

const orderModal = document.getElementById("orderModal");
const orderForm = document.getElementById("orderForm");
const selectedProduct = document.getElementById("selectedProduct");
const orderMessage = document.getElementById("orderMessage");


/* GOOGLE APPS SCRIPT URL */

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxr4k6kjPznbMaCbtfZKcVJihCaF1qfj88X7X0DaWOKMM52KlcKNw1x0p_tDwH_gJkz/exec";


let currentProduct = "";


/* OPEN ORDER FORM */

function openOrderForm(product) {

    currentProduct = product;

    selectedProduct.textContent = product;

    orderModal.classList.add("active");

    document.body.style.overflow = "hidden";

}


/* CLOSE ORDER FORM */

function closeOrderForm() {

    orderModal.classList.remove("active");

    document.body.style.overflow = "";

    orderMessage.innerHTML = "";

}


/* SUBMIT ORDER */

orderForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    const name =
        document.getElementById("customerName").value.trim();

    const phone =
        document.getElementById("customerPhone").value.trim();

    const quantity =
        document.getElementById("quantity").value;

    const address =
        document.getElementById("customerAddress").value.trim();


    if (phone.length !== 10) {

        alert("Please enter a valid 10-digit mobile number.");

        return;

    }


    const orderData = {

        name: name,

        phone: phone,

        product: currentProduct,

        quantity: quantity,

        address: address

    };


    const submitButton =
        document.querySelector(".submit-order");


    submitButton.disabled = true;

    submitButton.textContent = "PLACING ORDER...";


    try {

        await fetch(GOOGLE_SCRIPT_URL, {

            method: "POST",

            mode: "no-cors",

            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },

            body: JSON.stringify(orderData)

        });


        orderForm.reset();


        orderMessage.innerHTML = `
            <div class="success-message">

                <div class="success-icon">✓</div>

                <h3>Order Received!</h3>

                <p>
                    Thank you for ordering from Rabba Noir.
                    Your order has been submitted successfully.
                </p>

            </div>
        `;


    } catch (error) {

        orderMessage.innerHTML = `
            <div class="error-message">
                Something went wrong.
                Please try again.
            </div>
        `;

    }


    submitButton.disabled = false;

    submitButton.textContent = "PLACE ORDER";

});