const supertest = require("supertest");
const { app } = require("./server");

test("Home Page functional", () => {
    return supertest(app)
        .get("/")
        .then((res) => {
            expect(res.statusCode).toBe(200);
        });
});
