export class Camera {
    id: number = 0;
    monitorID: number = 0;
    name: string = '';
    type: string = '';
    y: number = 0;
    x: number = 0;
    owner: string = '';
    angle: number = 0;
    userID: number = 0;
    displayLevel: number = 0;
    telephone: string = '';
    isRunning: boolean = true;
    insertUser: string = '';

    public static toCamera(obj) {
        let c = new Camera();
        for (let key in obj) {
            if (c.hasOwnProperty(key)) {
                c[key] = obj[key];
            }
        }
        return c;
    }
}
