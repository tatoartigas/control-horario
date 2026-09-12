const hoy =
    new Date();

document.getElementById("mes")
    .value =
    hoy.getMonth();

document.getElementById("anio")
    .value =
    hoy.getFullYear();

generarMes();

periodoActual = obtenerPeriodo();