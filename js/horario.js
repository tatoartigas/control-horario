const OBJETIVO_DIARIO = 360;
const MINIMO_DIARIO = 180;

let objetivoMensual = 0;
let diasHabilesMes = 0;
let periodoActual = null;

function obtenerPeriodo() {

    const anio =
        document.getElementById("anio").value;

    const mes =
        document.getElementById("mes").value;

    return `${anio}-${mes}`;
}

async function cambiarPeriodo() {

    await guardarPeriodoFirebase();

    generarMes();

    await cargarPeriodoFirebase();

    periodoActual =
        obtenerPeriodo();
}

function borrarDatos() {
    generarMes();

    alert(
        "Datos eliminados"
    );
}

function minutos(hora) {

    if (!hora) return 0;

    let partes = hora.split(":");

    return parseInt(partes[0]) * 60 +
        parseInt(partes[1]);
}

function horaDesdeMinutos(total) {

    let h = Math.floor(total / 60);
    let m = total % 60;

    return String(h).padStart(2, '0')
        + ':'
        + String(m).padStart(2, '0');
}
function formatearFecha(fecha) {
    const dias = [
        "Dom",
        "Lun",
        "Mar",
        "Mié",
        "Jue",
        "Vie",
        "Sáb"
    ];
    return dias[fecha.getDay()] + " " + fecha.getDate();
}
function formatoSaldo(minutos) {

    const signo =
        minutos < 0 ? "-" : "+";

    minutos = Math.abs(minutos);

    let horas =
        Math.floor(minutos / 60);

    let mins =
        minutos % 60;

    return signo +
        String(horas).padStart(2, '0')
        + ':'
        + String(mins).padStart(2, '0');
}

function generarMes() {

    const mes =
        parseInt(
            document.getElementById("mes").value
        );

    const anio =
        parseInt(
            document.getElementById("anio").value
        );

    const tbody =
        document.querySelector("#tabla tbody");

    tbody.innerHTML = "";

    diasHabilesMes = 0;

    const ultimoDia =
        new Date(anio, mes + 1, 0).getDate();

    let semanaNumero = 1;

    for (let dia = 1; dia <= ultimoDia; dia++) {

        let fecha =
            new Date(anio, mes, dia);

        let dow = fecha.getDay();

        if (dow === 0 || dow === 6) {
            continue;
        }

        diasHabilesMes++;

        let fila =
            document.createElement("tr");

        fila.innerHTML = `
			<td>
				<select class="tipoDia">
					<option value="normal">
						${formatearFecha(fecha)}
					</option>
					<option value="licencia">
						Licencia
					</option>
					<option value="feriado">
						Feriado
					</option>
				</select>
			</td>

			<td>
				<input type="time" class="entrada">
			</td>

			<td class="minima"></td>

			<td class="objetivo"></td>

			<td>
				<input type="time" class="real">
			</td>

			<td class="saldo"></td>

			<td class="acumulado"></td>
		`;

        tbody.appendChild(fila);

        if (dow === 5) {

            let filaSemana =
                document.createElement("tr");

            filaSemana.className = "semana";

            filaSemana.innerHTML = `
			<td colspan="7"
				id="semana_${semanaNumero}">
				Semana ${semanaNumero}
			</td>
			`;

            tbody.appendChild(filaSemana);

            semanaNumero++;
        }
    }

    const ultimaFila = tbody.lastElementChild;

    if (
        ultimaFila &&
        !ultimaFila.classList.contains("semana")
    ) {

        let filaSemana =
            document.createElement("tr");

        filaSemana.className = "semana";

        filaSemana.innerHTML = `
		<td colspan="7"
			id="semana_${semanaNumero}">
			Semana ${semanaNumero}
		</td>
		`;

        tbody.appendChild(filaSemana);
    }
    objetivoMensual =
        diasHabilesMes *
        OBJETIVO_DIARIO;

    recalcular();
}
function actualizarTipoDia() {

    document
        .querySelectorAll("#tabla tbody tr")
        .forEach(fila => {

            if (fila.classList.contains("semana")) {
                return;
            }

            const tipo =
                fila.querySelector(".tipoDia");

            const entrada =
                fila.querySelector(".entrada");

            const real =
                fila.querySelector(".real");

            if (tipo.value === "licencia") {

                entrada.value = "09:00";
                real.value = "15:00";

                entrada.disabled = true;
                real.disabled = true;

                fila.querySelector(".saldo").textContent = "";
                fila.querySelector(".acumulado").textContent = "";

            } else if (tipo.value === "feriado") {

                entrada.value = "";
                real.value = "";

                entrada.disabled = true;
                real.disabled = true;

            } else {

                if (
                    tipo.dataset.anterior === "licencia" ||
                    tipo.dataset.anterior === "feriado"
                ) {
                    entrada.value = "";
                    real.value = "";

                    fila.querySelector(".minima").textContent = "";
                    fila.querySelector(".objetivo").textContent = "";
                    fila.querySelector(".saldo").textContent = "";
                    fila.querySelector(".acumulado").textContent = "";
                }

                entrada.disabled = false;
                real.disabled = false;
            }

            tipo.dataset.anterior =
                tipo.value;

        });

    recalcular();
}

function recalcular() {

    let filas =
        document.querySelectorAll(
            "#tabla tbody tr"
        );

    let trabajadoMes = 0;
    let acumulado = 0;
    let saldoSemana = 0;
    let nroSemana = 1;
    let cantidadFeriados = 0;

    filas.forEach(fila => {

        if (fila.classList.contains("semana")) {

            let celda =
                document.getElementById(
                    "semana_" + nroSemana
                );

            celda.innerHTML =
                saldoSemana >= 0
                    ? `Semana ${nroSemana}: <span class="positivo">+${formatoSaldo(saldoSemana)}</span>`
                    : `Semana ${nroSemana}: <span class="negativo">${saldoSemana} minutos</span>`;

            saldoSemana = 0;
            nroSemana++;

            return;
        }

        let entrada =
            fila.querySelector(".entrada");

        let real =
            fila.querySelector(".real");

        let tipo =
            fila.querySelector(".tipoDia");

        entrada.classList.remove("error");
        real.classList.remove("error");

        if (
            tipo &&
            (
                tipo.value === "licencia" ||
                tipo.value === "feriado"
            )
        ) {

            if (tipo.value === "feriado") {

                cantidadFeriados++;

                fila.querySelector(".minima").textContent =
                    "Feriado";

                fila.querySelector(".objetivo").textContent =
                    "Feriado";

                fila.querySelector(".saldo").textContent =
                    "Feriado";

                fila.querySelector(".acumulado").textContent =
                    "";

                return;
            }

            if (tipo.value === "licencia") {

                fila.querySelector(".minima").textContent =
                    "12:00";

                fila.querySelector(".objetivo").textContent =
                    "15:00";

                trabajadoMes += OBJETIVO_DIARIO;

                return;
            }
        }

        if (!entrada.value) {
            return;
        }

        let minEntrada =
            minutos(entrada.value);

        fila.querySelector(".minima").textContent =
            horaDesdeMinutos(
                minEntrada + MINIMO_DIARIO
            );

        fila.querySelector(".objetivo").textContent =
            horaDesdeMinutos(
                minEntrada + OBJETIVO_DIARIO
            );

        if (!real.value) {
            return;
        }

        let minReal =
            minutos(real.value);

        if (minReal <= minEntrada) {

            real.classList.add("error");

            fila.querySelector(".saldo").innerHTML =
                "<span class='negativo'>Error</span>";

            return;
        }

        if ((minReal - minEntrada) < MINIMO_DIARIO) {

            real.classList.add("error");

            fila.querySelector(".saldo").innerHTML =
                "<span class='negativo'>Menos de 3h</span>";

            return;
        }

        let trabajado =
            minReal - minEntrada;

        trabajadoMes += trabajado;

        let saldo =
            trabajado - OBJETIVO_DIARIO;

        saldoSemana += saldo;
        acumulado += saldo;

        let saldoCelda =
            fila.querySelector(".saldo");

        saldoCelda.textContent =
            formatoSaldo(saldo);

        saldoCelda.className =
            saldo >= 0
                ? "saldo positivo"
                : "saldo negativo";

        let acumuladoCelda =
            fila.querySelector(".acumulado");

        acumuladoCelda.textContent =
            formatoSaldo(acumulado);

        acumuladoCelda.className =
            acumulado >= 0
                ? "acumulado positivo"
                : "acumulado negativo";
    });

    let diasHabilesReales =
        diasHabilesMes - cantidadFeriados;

    let objetivoMensualReal =
        diasHabilesReales *
        OBJETIVO_DIARIO;

    let diferencia =
        trabajadoMes -
        objetivoMensualReal;

    let html = `		
		<b>Días hábiles:</b>
		${diasHabilesReales}
		<br><br>

		<b>Objetivo diario:</b>
		06:00 horas
		<br><br>

		<b>Objetivo mensual:</b>
		${horaDesdeMinutos(objetivoMensualReal)}
		<br><br>

		<b>Horas realizadas:</b>
		${horaDesdeMinutos(trabajadoMes)}
		<br><br>
        
		<b>Saldo acumulado:</b>
		<span class="${diferencia >= 0
            ? "positivo"
            : "negativo"
        }">
		${formatoSaldo(diferencia)}
		</span><br><br>
		`;
    if (diferencia < 0) {
        html += `
		<div class="faltante">
		TE FALTAN
		${horaDesdeMinutos(
            Math.abs(diferencia)
        )}
		HORAS
		</div>
		`;
    } else if (diferencia > 0) {
        html += `
		<div class="sobrante">
		TE SOBRAN
		${horaDesdeMinutos(
            diferencia
        )}
		HORAS
		</div>
		`;
    } else {
        html += `
		<div class="sobrante">
		OBJETIVO MENSUAL CUMPLIDO
		</div>
		`;
    }

    document.getElementById("resumen")
        .innerHTML = html;
}

document.addEventListener(
    "input",
    function () {

        recalcular();

        guardarPeriodoFirebase();
    }
);

document
    .getElementById("mes")
    .addEventListener(
        "change",
        cambiarPeriodo
    );

document
    .getElementById("anio")
    .addEventListener(
        "change",
        cambiarPeriodo
    );

document.addEventListener(
    "change",
    function (e) {
        if (
            e.target.classList.contains(
                "tipoDia"
            )
        ) {
            actualizarTipoDia();
        }
    }
);
