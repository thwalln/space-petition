(() => {
    ///////////////////////////////////////////// SETUP VARIBALES /////////////////////////////////////////////

    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");

    let signing = false;
    let x = 0;
    let y = 0;

    ///////////////////////////////////////////// HELPER FUNCTIONS /////////////////////////////////////////////

    const drawSignature = (x, y, offsetX, offsetY) => {
        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        ctx.moveTo(x, y);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    ///////////////////////////////////////////// EVENT LISTENER  /////////////////////////////////////////////

    canvas.addEventListener("mousedown", (e) => {
        signing = true;
        x = e.offsetX;
        y = e.offsetY;
    });

    canvas.addEventListener("mousemove", (e) => {
        if (signing === true) {
            drawSignature(x, y, e.offsetX, e.offsetY);
            x = e.offsetX;
            y = e.offsetY;
        }
    });

    canvas.addEventListener("mouseup", () => {
        signing = false;
    });
})();
