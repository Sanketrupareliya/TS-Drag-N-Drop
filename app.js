"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ProSta;
(function (ProSta) {
    ProSta[ProSta["Active"] = 0] = "Active";
    ProSta[ProSta["Finished"] = 1] = "Finished";
})(ProSta || (ProSta = {}));
class Project {
    constructor(id, title, descrip, peo, status) {
        this.id = id;
        this.title = title;
        this.descrip = descrip;
        this.peo = peo;
        this.status = status;
    }
}
class state {
    constructor() {
        this.listners = [];
    }
    addListn(listnerFn) {
        this.listners.push(listnerFn);
    }
}
class ProState extends state {
    constructor() {
        super();
        this.projects = [];
    }
    static getInst() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new ProState();
        return this.instance;
    }
    addProject(title, descri, numOfPeo) {
        const newPro = new Project(Math.random().toString(), title, descri, numOfPeo, ProSta.Active);
        this.projects.push(newPro);
        this.updateListn();
    }
    movePro(projectId, newSta) {
        const project = this.projects.find(prj => prj.id === projectId);
        if (project && project.status !== newSta) {
            project.status = newSta;
            this.updateListn();
        }
    }
    updateListn() {
        for (const listnerFn of this.listners) {
            listnerFn(this.projects.slice());
        }
    }
}
const projectState = ProState.getInst();
function validate(validatableIn) {
    let isValid = true;
    if (validatableIn.required) {
        isValid = isValid && validatableIn.value.toString().trim().length !== 0;
    }
    if (validatableIn.minLength != null && typeof validatableIn.value === 'string') {
        isValid = isValid && validatableIn.value.length >= validatableIn.minLength;
    }
    if (validatableIn.maxLength != null && typeof validatableIn.value === 'string') {
        isValid = isValid && validatableIn.value.length <= validatableIn.maxLength;
    }
    if (validatableIn.min != null && typeof validatableIn.value === 'number') {
        isValid = isValid && validatableIn.value >= validatableIn.min;
    }
    if (validatableIn.max != null && typeof validatableIn.value === 'number') {
        isValid = isValid && validatableIn.value <= validatableIn.max;
    }
    return isValid;
}
//autobind
function autobind(target, methodName, descriptor) {
    const origiMethon = descriptor.value;
    const adjDes = {
        configurable: true,
        get() {
            const bound = origiMethon.bind(this);
            return bound;
        }
    };
    return adjDes;
}
//component base class
class Component {
    constructor(tempId, hostEle, insertAtSt, newEleId) {
        this.templateElement = (document.getElementById(tempId));
        this.hostElement = document.getElementById(hostEle);
        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild;
        if (newEleId) {
            this.element.id = newEleId;
        }
        this.attach(insertAtSt);
    }
    attach(insertAtSt) {
        this.hostElement.insertAdjacentElement(insertAtSt ? 'afterbegin' : 'beforeend', this.element);
    }
}
//Project item
class ProItm extends Component {
    constructor(hostId, project) {
        super('single-project', hostId, false, project.id);
        this.project = project;
        this.configure();
        this.rendercon();
    }
    get persons() {
        if (this.project.peo === 1) {
            return '1 Person';
        }
        else {
            return `${this.project.peo} Persons`;
        }
    }
    dragStart(event) {
        event.dataTransfer.setData('text/plain', this.project.id);
        event.dataTransfer.effectAllowed = 'move';
    }
    dragEnd(event) {
        console.log('DragEnd');
    }
    configure() {
        this.element.addEventListener('dragstart', this.dragStart);
        this.element.addEventListener('dragend', this.dragEnd);
    }
    rendercon() {
        this.element.querySelector('h2').textContent = this.project.title;
        this.element.querySelector('h3').textContent = this.persons + ' assigned';
        this.element.querySelector('p').textContent = this.project.descrip;
    }
}
__decorate([
    autobind,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DragEvent]),
    __metadata("design:returntype", void 0)
], ProItm.prototype, "dragStart", null);
//Project list
class ProjectList extends Component {
    constructor(type) {
        super('project-list', 'app', false, `${type}-projects`);
        this.type = type;
        this.assignedPro = [];
        this.configure();
        this.rendercon();
    }
    dragOver(event) {
        if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
            event.preventDefault();
            const listEl = this.element.querySelector('ul');
            listEl.classList.add('droppable');
        }
    }
    dropHand(event) {
        const prjId = event.dataTransfer.getData('text/plain');
        projectState.movePro(prjId, this.type === 'active' ? ProSta.Active : ProSta.Finished);
    }
    dragLeave(event) {
        const listEl = this.element.querySelector('ul');
        listEl.classList.remove('droppable');
    }
    renderPro() {
        const listEl = document.getElementById(`${this.type}-projects-list`);
        listEl.innerHTML = '';
        for (const prjItm of this.assignedPro) {
            new ProItm(this.element.querySelector('ul').id, prjItm);
        }
    }
    configure() {
        this.element.addEventListener('dragover', this.dragOver);
        this.element.addEventListener('dragleave', this.dragLeave);
        this.element.addEventListener('drop', this.dropHand);
        projectState.addListn((projects) => {
            const relevantPro = projects.filter(prj => {
                if (this.type === 'active') {
                    return prj.status === ProSta.Active;
                }
                return prj.status === ProSta.Finished;
            });
            this.assignedPro = relevantPro;
            this.renderPro();
        });
    }
    rendercon() {
        const lisid = `${this.type}-projects-list`;
        this.element.querySelector('ul').id = lisid;
        this.element.querySelector('h2').textContent = this.type.charAt(0).toUpperCase() + this.type.slice(1) + ' Projects';
    }
}
__decorate([
    autobind,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DragEvent]),
    __metadata("design:returntype", void 0)
], ProjectList.prototype, "dragOver", null);
__decorate([
    autobind,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DragEvent]),
    __metadata("design:returntype", void 0)
], ProjectList.prototype, "dropHand", null);
__decorate([
    autobind,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DragEvent]),
    __metadata("design:returntype", void 0)
], ProjectList.prototype, "dragLeave", null);
//input
class ProjectInput extends Component {
    constructor() {
        super('project-input', 'app', true, 'user-input');
        this.titleIn = this.element.querySelector("#title");
        this.descriIn = this.element.querySelector("#description");
        this.peopIn = this.element.querySelector("#people");
        this.configure();
    }
    configure() {
        this.element.addEventListener("submit", this.submit);
    }
    rendercon() { }
    gatherIn() {
        const entTit = this.titleIn.value;
        const entDes = this.descriIn.value;
        const entPeo = this.peopIn.value;
        const titvali = {
            value: entTit,
            required: true
        };
        const desvali = {
            value: entDes,
            required: true,
            minLength: 5
        };
        const peovali = {
            value: +entPeo,
            required: true,
            min: 1,
            max: 5
        };
        const titalert = document.getElementById('textAlert');
        const desAlert = document.getElementById('descriptionAlert');
        const peoAlert = document.getElementById('peoAlert');
        if (!validate(titvali)) {
            titalert.style.display = "block";
            return;
        }
        if (!validate(desvali)) {
            desAlert.style.display = "block";
            return;
        }
        if (!validate(peovali)) {
            peoAlert.style.display = "block";
            return;
        }
        // if(
        //     !validate(titvali) ||
        //     !validate(desvali) ||
        //     !validate(peovali)
        // )
        // {
        //     alert("Invalid input, please try again!");
        //     return;
        // }
        else {
            peoAlert.style.display = "none";
            desAlert.style.display = "none";
            titalert.style.display = "none";
            return [entTit, entDes, +entPeo];
        }
    }
    clear() {
        this.titleIn.value = '';
        this.descriIn.value = '';
        this.peopIn.value = '';
    }
    submit(event) {
        event.preventDefault();
        const userIn = this.gatherIn();
        if (Array.isArray(userIn)) {
            const [title, desc, people] = userIn;
            projectState.addProject(title, desc, people);
            this.clear();
        }
    }
}
__decorate([
    autobind,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Event]),
    __metadata("design:returntype", void 0)
], ProjectInput.prototype, "submit", null);
const prj = new ProjectInput();
const activeProList = new ProjectList('active');
const finishedProList = new ProjectList('finished');
