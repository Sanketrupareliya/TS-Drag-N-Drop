//Drag N Drop
interface Draggable{
    dragStart(event: DragEvent): void;
    dragEnd(event: DragEvent): void;
}

interface DragTarget{
    dragOver(event: DragEvent): void;
    dropHand(event: DragEvent): void;
    dragLeave(event: DragEvent): void;
}


enum ProSta{Active,Finished}

class Project{
   constructor(public id: string, public title: string, public descrip: string, public peo: number, public status: ProSta){} 

}



//Projrct state management
type Listner<T> = (items: T[]) => void;

class state<T>{
    protected listners: Listner<T>[] = [];

    addListn(listnerFn: Listner<T>){
        this.listners.push(listnerFn);
    }
}


class ProState extends state<Project>{

    private projects: Project[] = [];
    private static instance: ProState;
    
    private constructor(){
        super();
    }

    static getInst(){
        if(this.instance){
            return this.instance;
        }
        this.instance=new ProState();
        return this.instance;
    }

    addProject(title: string, descri:string, numOfPeo:number){
        const newPro=new Project(
            Math.random().toString(),
            title,
            descri,
            numOfPeo,
            ProSta.Active
        );
        this.projects.push(newPro);
        this.updateListn();
    }

    movePro(projectId: string, newSta: ProSta){
        const project=this.projects.find(prj => prj.id===projectId);
        if(project && project.status!== newSta){
            project.status=newSta;
            this.updateListn();
        }
    }

    private updateListn(){
        for(const listnerFn of this.listners){
            listnerFn(this.projects.slice());
        }
    }
}

const projectState=ProState.getInst();



//validate
interface validatable{
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
}

function validate(validatableIn: validatable){
    let isValid=true;
    if(validatableIn.required){
        isValid=isValid && validatableIn.value.toString().trim().length !== 0;
    }
    if(validatableIn.minLength != null && typeof validatableIn.value === 'string'){
        isValid=isValid && validatableIn.value.length >= validatableIn.minLength;
    }
    if(validatableIn.maxLength != null && typeof validatableIn.value === 'string'){
        isValid=isValid && validatableIn.value.length <= validatableIn.maxLength;
    }
    if(validatableIn.min != null && typeof validatableIn.value === 'number'){
        isValid= isValid && validatableIn.value >= validatableIn.min;
    }
    if(validatableIn.max != null && typeof validatableIn.value === 'number'){
        isValid= isValid && validatableIn.value <= validatableIn.max;
    }
    return isValid;
}

//autobind
function autobind(
  target: any,
  methodName: string,
  descriptor: PropertyDescriptor
) {
    const origiMethon= descriptor.value;
    const adjDes:PropertyDescriptor={
        configurable: true,
        get(){
            const bound=origiMethon.bind(this);
            return bound;
        }
    };
    return adjDes; 
}

//component base class
abstract class Component<T extends HTMLElement, U extends HTMLElement>{
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    constructor(tempId: string, hostEle: string, insertAtSt: boolean, newEleId?: string,){
        this.templateElement = <HTMLTemplateElement>(
            document.getElementById(tempId)
          )!;
        this.hostElement = document.getElementById(hostEle)! as T;

        const importedNode = document.importNode(
            this.templateElement.content,
            true
          );
        this.element = importedNode.firstElementChild as U;
        if(newEleId){
            this.element.id = newEleId;
        }
        this.attach(insertAtSt);
    }
    private attach(insertAtSt: boolean){
        this.hostElement.insertAdjacentElement(insertAtSt? 'afterbegin':'beforeend', this.element);
    }

    abstract configure(): void;
    abstract rendercon(): void;
}

//Project item
class ProItm extends Component<HTMLUListElement, HTMLLIElement> 
    implements Draggable{
    private project: Project;

    get persons(){
        if(this.project.peo ===1){
            return '1 Person';
        }
        else{
            return `${this.project.peo} Persons`
        }
    }

    constructor(hostId: string, project: Project){
        super('single-project', hostId, false, project.id);
        this.project=project;

        this.configure();
        this.rendercon();
    }

    @autobind
    dragStart(event: DragEvent){
        event.dataTransfer!.setData('text/plain', this.project.id);
        event.dataTransfer!.effectAllowed='move';
    }

    dragEnd(event: DragEvent){
        console.log('DragEnd');
    }

    configure(){
        this.element.addEventListener('dragstart', this.dragStart);
        this.element.addEventListener('dragend', this.dragEnd);
    }

    rendercon(): void {
        this.element.querySelector('h2')!.textContent=this.project.title;
        this.element.querySelector('h3')!.textContent=this.persons+ ' assigned';
        this.element.querySelector('p')!.textContent=this.project.descrip;
    }
}



//Project list
class ProjectList extends Component<HTMLDivElement, HTMLElement>
    implements DragTarget{
    assignedPro: Project[];

    constructor(private type: 'active' | 'finished'){
        super('project-list', 'app', false, `${type}-projects`);
        this.assignedPro=[];

        this.configure();
        this.rendercon();
    }

    @autobind
    dragOver(event: DragEvent){
        if(event.dataTransfer && event.dataTransfer.types[0]==='text/plain'){
            event.preventDefault();
            const listEl=this.element.querySelector('ul')!;
            listEl.classList.add('droppable');
        }
    }

    @autobind
    dropHand(event: DragEvent){
        const prjId= event.dataTransfer!.getData('text/plain');
        projectState.movePro(prjId, this.type==='active'? ProSta.Active:ProSta.Finished);
    }

    @autobind
    dragLeave(event: DragEvent){
        const listEl=this.element.querySelector('ul')!;
        listEl.classList.remove('droppable');
    }

    private renderPro(){
        const listEl=document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
        listEl.innerHTML='';
        for ( const prjItm of this.assignedPro){
            new ProItm(this.element.querySelector('ul')!.id, prjItm);
        }
    }

    configure() {
        this.element.addEventListener('dragover', this.dragOver);
        this.element.addEventListener('dragleave', this.dragLeave);
        this.element.addEventListener('drop', this.dropHand);

        projectState.addListn((projects: Project[]) => {
            const relevantPro=projects.filter(prj =>{
                if(this.type==='active'){
                    return prj.status===ProSta.Active;
                }
                return prj.status === ProSta.Finished;
            });
            this.assignedPro=relevantPro;
            this.renderPro();
        });
    }

    rendercon(){
        const lisid=`${this.type}-projects-list`;
        this.element.querySelector('ul')!.id=lisid;
        this.element.querySelector('h2')!.textContent=this.type.charAt(0).toUpperCase()+this.type.slice(1)+ ' Projects';
    }
}



//input
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleIn: HTMLInputElement;
  descriIn: HTMLInputElement;
  peopIn: HTMLInputElement;

  constructor() { 
    super('project-input', 'app', true, 'user-input');
    this.titleIn = this.element.querySelector("#title") as HTMLInputElement;
    this.descriIn = this.element.querySelector("#description") as HTMLInputElement;
    this.peopIn = this.element.querySelector("#people") as HTMLInputElement;

    this.configure();
  }

  configure(){
    this.element.addEventListener("submit", this.submit);
  }

  rendercon(): void {}

  private gatherIn():[string, string, number] | void{
    const entTit=this.titleIn.value;
    const entDes=this.descriIn.value;
    const entPeo=this.peopIn.value;

    const titvali: validatable={
        value:entTit,
        required:true
    };
    const desvali: validatable={
        value: entDes,
        required: true,
        minLength: 5
    };
    const peovali:validatable={
        value: +entPeo,
        required: true,
        min: 1,
        max: 5
    }
    const titalert=document.getElementById('textAlert')!;
    const desAlert=document.getElementById('descriptionAlert')!;
    const peoAlert=document.getElementById('peoAlert')!;
    if(!validate(titvali)){
        titalert.style.display = "block";
        return
    }
    if(!validate(desvali)){
        desAlert.style.display="block";
        return
    }
    if(!validate(peovali)){
        peoAlert.style.display="block";
        return
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
    else{
        peoAlert.style.display="none";
        desAlert.style.display="none";
        titalert.style.display = "none";
        return [entTit, entDes, +entPeo];
    }
  }


  private clear(){
      this.titleIn.value='';
      this.descriIn.value='';
      this.peopIn.value='';
  }


  @autobind
  private submit(event: Event) {
    event.preventDefault();
    const userIn=this.gatherIn();
    if(Array.isArray(userIn)){
        const [title,desc,people]=userIn;
        projectState.addProject(title, desc, people);
        this.clear();
    }
  }

}

const prj = new ProjectInput();
const activeProList=new ProjectList('active');
const finishedProList=new ProjectList('finished'); 
