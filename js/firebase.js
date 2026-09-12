
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    deleteDoc
}

    from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
}
    from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCATIddYi740alPZN2pclQC3kdprVIlRfs",
    authDomain: "control-horario-fef24.firebaseapp.com",
    projectId: "control-horario-fef24",
    storageBucket: "control-horario-fef24.firebasestorage.app",
    messagingSenderId: "280269536972",
    appId: "1:280269536972:web:9f305847ef3506af4d8c69",
    measurementId: "G-9D9EY1YDHG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const db = getFirestore(app);

window.db = db;
window.doc = doc;
window.setDoc = setDoc;
window.getDoc = getDoc;
window.deleteDoc = deleteDoc;
window.auth = auth;

console.log("Firebase conectado");

window.GoogleAuthProvider = GoogleAuthProvider;
window.signInWithPopup = signInWithPopup;
window.signOut = signOut;

window.loginGoogle = async function () {

    try {

        const provider =
            new GoogleAuthProvider();

        await signInWithPopup(
            auth,
            provider
        );

    } catch (error) {

        console.error(
            "Error Login:",
            error
        );

    }

};

window.logout = async function () {

    try {

        await signOut(auth);

    } catch (error) {

        console.error(
            "Error Logout:",
            error
        );

    }

};

onAuthStateChanged(auth, async (user) => {
    if (!user) {

        document.getElementById(
            "usuario"
        ).innerHTML = `
            <button onclick="loginGoogle()">
                Iniciar sesión con Google
            </button>
        `;

        return;
    }


    document.getElementById("usuario").innerHTML = `
        <div style="
            display:flex;
            align-items:center;
            gap:10px;
            background:#1976d2;
            color:white;
            padding:10px;
            border-radius:12px;
        ">

            <img
                src="${user.photoURL || 'macaco.png'}"
                width="50"
                height="50"
                style="
                    border-radius:50%;
                    object-fit:cover;">
                    ${user.email}
                </div>
            </div>

            <button onclick="logout()">
                Salir
            </button>

        </div>
        `;
    window.usuarioActual = user;
    await cargarPeriodoFirebase();

});

async function guardarPeriodoFirebase() {

    if (!window.usuarioActual) {
        return;
    }

    try {

        const periodo =
            obtenerPeriodo();

        const registros = [];

        document
            .querySelectorAll(
                "#tabla tbody tr:not(.semana)"
            )
            .forEach(fila => {

                registros.push({

                    tipo:
                        fila.querySelector(".tipoDia").value,

                    entrada:
                        fila.querySelector(".entrada").value,

                    salida:
                        fila.querySelector(".real").value
                });

            });

        await window.setDoc(

            window.doc(
                window.db,
                "usuarios",
                window.usuarioActual.uid,
                "periodos",
                periodo
            ),

            {
                periodo: periodo,
                registros: registros,
                actualizado:
                    new Date().toISOString()
            }

        );

        console.log(
            "Periodo guardado en Firestore:",
            periodo
        );

    } catch (error) {

        console.error(
            "Error guardando Firestore:",
            error
        );

    }

}

async function cargarPeriodoFirebase() {

    if (!window.usuarioActual) {
        return;
    }

    try {

        const periodo =
            obtenerPeriodo();

        const documento =
            await window.getDoc(

                window.doc(
                    window.db,
                    "usuarios",
                    window.usuarioActual.uid,
                    "periodos",
                    periodo
                )

            );

        if (!documento.exists()) {

            document
                .querySelectorAll(
                    "#tabla tbody tr:not(.semana)"
                )
                .forEach(fila => {

                    fila.querySelector(".tipoDia").value = "normal";
                    fila.querySelector(".entrada").value = "";
                    fila.querySelector(".real").value = "";

                });

            actualizarTipoDia();
            recalcular();

            return;
        }

        const datos =
            documento.data();

        const filas =
            document.querySelectorAll(
                "#tabla tbody tr:not(.semana)"
            );

        datos.registros.forEach(
            (registro, index) => {

                if (!filas[index]) {
                    return;
                }

                filas[index]
                    .querySelector(".tipoDia")
                    .value =
                    registro.tipo || "";

                filas[index]
                    .querySelector(".entrada")
                    .value =
                    registro.entrada || "";

                filas[index]
                    .querySelector(".real")
                    .value =
                    registro.salida || "";

            }
        );

        actualizarTipoDia();
        recalcular();

        console.log(
            "Periodo cargado desde Firestore:",
            periodo
        );

    } catch (error) {

        console.error(
            "Error cargando Firestore:",
            error
        );

    }

}

if (typeof cargarPeriodoFirebase === "function") {
    cargarPeriodoFirebase();
}

const pruebaFirestore = async () => {

    try {

        const documento = doc(
            db,
            "pruebas",
            "conexion"
        );

        await setDoc(documento, {
            fecha: new Date().toISOString(),
            mensaje: "Conexión OK"
        });

        console.log(
            "Documento guardado en Firestore"
        );

    } catch (error) {

        console.error(
            "Error Firestore:",
            error
        );

    }

};

pruebaFirestore();