(function () {
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");

    let signing = false;
    let x = 0;
    let y = 0;

    function drawLine(ctx, x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.closePath();
    }

    canvas.addEventListener("mousedown", (e) => {
        console.log("mousedown: ", e.offsetX, e.offsetY);
        x = e.offsetX;
        y = e.offsetY;
        signing = true;
    });

    canvas.addEventListener("mousemove", (e) => {
        if (signing === true) {
            drawLine(ctx, x, y, e.offsetX, e.offsetY);
            x = e.offsetX;
            y = e.offsetY;
        }
    });

    window.addEventListener("mouseup", (e) => {
        if (signing === true) {
            drawLine(ctx, x, y, e.offsetX, e.offsetY);
            x = 0;
            y = 0;
            signing = false;
        }
        const dataURL = canvas.toDataURL();
        document.getElementById("signature").value = dataURL;
    });
})();
