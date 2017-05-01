import {Queue, Stack} from "typescript-collections";
import "./util";

/**
 * A Lexical Analysis Scanner.
 * 
 * Parses a string of characters into a queue of tokens, or throws an error if an unexpected character is encountered.
 */
class Scanner {
    public constructor(proposition: string) {
        this.chars = new Queue<string>();
        this.tokens = new Queue<string>();
        for (let i = 0; i < proposition.length; i++) {
            this.chars.enqueue(proposition.charAt(i));
        }

        while (!this.chars.isEmpty()) {
            let curr: string = this.chars.dequeue();
            switch (curr) {
                case "!":
                    this.tokens.enqueue(curr);
                    break;
                case "&":
                    if (this.chars.peek() === "&") {
                        this.tokens.enqueue("&&");
                        this.chars.dequeue();
                    } else {
                        throw Error("Unexpected token: '" + this.chars.peek() + "' after '&' (expected '&').");
                    }
                    break;
                case "|":
                    if (this.chars.peek() === "|") {
                        this.tokens.enqueue("||");
                        this.chars.dequeue();
                    } else {
                        throw Error("Unexpected token: '" + this.chars.peek() + "' after '|' (expected '|').");
                    }
                    break;
                case "-":
                    if (this.chars.peek() === ">") {
                        this.tokens.enqueue("->");
                        this.chars.dequeue();
                    } else {
                        throw Error("Unexpected token: '" + this.chars.peek() + "' after '-' (expected '>').");
                    }
                    break;
                default:
                    if (curr.match(/[a-z]/i)) {
                        while (!this.chars.isEmpty() && this.chars.peek().match(/[a-z0-9]/i)) {
                            curr += this.chars.dequeue();
                        }
                        this.tokens.enqueue(curr);
                    } else if (curr.match(/[\(\)]/)) {
                        this.tokens.enqueue(curr);
                    } else if (curr.match(/\s/)) {
                        // Do nothing
                    }  else {
                        throw Error("Unexpected token: '" + curr + "'");
                    }
            }
        }
    }

    private chars: Queue<string>;
    private tokens: Queue<string>;

    public peek(): string { 
        return this.tokens.peek();
    }
    public pop(): string {
        return this.tokens.dequeue();
    }
    public isEmpty(): boolean {
        return this.tokens.isEmpty();
    }
}

/** 
 * Parses an infix proposition into a Proposition object. 
 */
class Parser {  
    /** The Proposition object created once the syntax has been parsed and verified. */
    public proposition: Proposition;

    /** The Scanner object used to scan the input string for tokens. */
    private scanner: Scanner;

    /** The operator stack. */
    private operators: Stack<string> = new Stack<string>();

    /** The operand stack. */
    private operands: Stack<Proposition> = new Stack<Proposition>();

    public constructor(proposition: string) {
        this.scanner = new Scanner(proposition);
        this.parse();
    }

    /** Parses the list of tokens into a Proposition object. */
    private parse(): void {
        // Parse the tokens into propositions
        while (!this.scanner.isEmpty()) {
            let curr: string = this.scanner.pop();

            switch (curr) {
                // If "(", push to operator stack
                case "(":
                    this.operators.push(curr);
                    break;
                // If ")", push all possible propositions until we reach matching "("
                case ")":
                    while (this.operators.peek() !== "(") { 
                        if (this.operators.isEmpty()) { throw Error("Found unbalanced parentheses: ')'."); }
                        this.pushProposition(); 
                    }
                    this.operators.pop(); // Pop the matching "("
                    break;
                // If an operator, push all possible propositions until the top of the operator stack is lower precedence
                case "!":
                    while (this.operators.peek() === "!") {
                        this.pushProposition();
                    }
                    this.operators.push(curr);
                    break;
                case "&&":
                    while (!this.operators.isEmpty() && this.operators.peek().in("!", "&&")) {
                        this.pushProposition();
                    }
                    this.operators.push(curr);
                    break;
                case "||":
                    while (!this.operators.isEmpty() && this.operators.peek().in("!", "&&", "||")) {
                        this.pushProposition();
                    }
                    this.operators.push(curr);
                    break;
                case "->":
                    while (!this.operators.isEmpty() && this.operators.peek().in("!", "&&", "||", "->")) {
                        this.pushProposition();
                    }
                    this.operators.push(curr);
                    break;
                // Everything else must be a single propositional symbol (variable)
                default:
                    this.operands.push(new Proposition(curr));
                    break;
            }
        }

        // Push remaining propositions
        while (!this.operators.isEmpty()) {
            this.pushProposition();
        }

        if (this.operands.size() === 1) {
            this.proposition = this.operands.pop();
        } else {
            throw Error("Operand stack size > 1 after parsing.");
        }
    }

    /** Creates a new proposition object from the operator and operand stacks, and pushes the result to the operand stack. */
    private pushProposition(): void {
        // Get the operator and first operand
        let op: string = this.operators.pop();
        let op1: Proposition = this.operands.pop();
        
        // If operator is binary, assign a value to op2, else leave it undefined
        let op2: Proposition = undefined;
        if (op.in("&&", "||", "->")) { 
            op2 = op1;
            op1 = this.operands.pop();
        }

        if (op.in("(", ")")) {
            throw Error("Found unbalanced parenetheis: '" + op + "'.");
        }

        // Create, push, and log the Proposition object
        let prop: Proposition = new Proposition(op1, op, op2);
        this.operands.push(prop);
        console.log("Pushed new proposition: " + prop.toString());
    }
}

/**
 * A proposition is defined as any propositional symbol, a unary operator and a proposition, or two propositions separated by a binary operator.
 * 
 * It is represented more or less as a binary tree structure, with each Proposition (node) containing an operator (value) and left and right operands (children).
 */
export class Proposition {
    public constructor(operand1: string | Proposition, operator?: string, operand2?: string | Proposition) {       
        if (operand1 === undefined || operand1 === null) {
            throw Error("Syntax error.")
        } else if (typeof(operand1) === "string" && (operator === undefined || operator === null)) {
            if (operand1.match(/^[a-z][a-z0-9]*$/i)) {
                this.operand1 = operand1;
            } else {
                let parser = new Parser(operand1);
                this.operand1 = parser.proposition.operand1;
                this.operator = parser.proposition.operator;
                this.operand2 = parser.proposition.operand2;
            }
        } else {
            this.operand1 = operand1;

            if (operator !== undefined && operator !== null) {
                this.operator = operator;
                
                if (operand2 !== undefined && operand2 !== null) {
                    this.operand2 = operand2;
                } else {
                    // If no second operand, verify operator is unary
                    if (operator !== "!") { 
                        throw Error("Only one operand provided in Proposition constructor with binary operator '" + operator + "'."); 
                    }
                }
            }
        }
    }

    /**
     * The first operand; may be another proposition or a single symbol.
     */
    public operand1: Proposition | string;

    /**
     * The operator; if null, the proposition consists of only a single propositional symbol.
     */
    public operator?: string;

    /**
     * The second operand if the operator is binary, null if the operator is null or unary.
     */
    public operand2?: Proposition | string;

    /**
     * A proposition with no operator must consist of only a single propositional symbol.
     */
    public atomic(): boolean {
        return this.operator === null || this.operator === undefined;
    }

    /** 
     * Converts the Proposition to a fully-parenthesized string expression. 
     */
    public toString(): string {
        let val: string = "";

        if (this.atomic()) {
            val += this.operand1;
        } else {
            if (this.operator === "!") {
                val += this.operator;
                val += this.operand1.toString();
            } else {
                val += "(";
                val += this.operand1.toString();
                val += this.operator;
                val += this.operand2.toString();
                val += ")";
            }
        }

        return val;
    }
}

export class Sequent {
    public constructor(assumptions?: Array<Proposition>, conclusions?: Array<Proposition>) {
        this.assumptions = assumptions || new Array<Proposition>();
        this.conclusions = conclusions || new Array<Proposition>();
    }
    
    /**
     * The "left" side of the sequent; i.e. the propositions assumed to be true
     */
    public assumptions: Array<Proposition>;

    /**
     * The "right" side of the sequent; i.e. the propositions assumed to be false
     */
    public conclusions: Array<Proposition>;

    /**
     * A sequent is finished if it is an axiom, or if all of its propositions consist of only propositional symbols.
     */
    public finished(): boolean {
        return this.axiom() || (this.assumptions.all((val) => { return val.atomic(); }) && this.conclusions.all((val) => { return val.atomic(); }));
    }

    /**
     * A sequent is an axiom if its assumptions and conclusions share a common proposition.
     */
    public axiom(): boolean {
        let axiom: boolean = false;
        let conclusions = this.conclusions;
        
        // Compare each assumption to each conclusion
        this.assumptions.forEach(function (assumption) {
            if (conclusions.any((conclusion) => { return assumption.toString() === conclusion.toString(); })) {
                axiom = true;
                return;
            }
        });

        return axiom;
    }

    /**
     * A sequent is falsifiable if it is finished and not an axiom. 
     * 
     * If a sequent is falsifiable, the remaining propositional symbols in its assumptions and conclusions are the true and false values (respectively) which falsify the original proposition.
     */
    public falsifiable(): boolean {
        return this.finished() && !this.axiom();
    }

    public toString(): string {
        let str: string = "";
        let last: number;

        str += "{ [";
        last = this.assumptions.length - 1;
        this.assumptions.forEach(function(prop, i) {
            str += prop.toString();
            if (i !== last) {
                str += ", ";
            }
        });
        str += "]; [";
        last = this.conclusions.length - 1;
        this.conclusions.forEach(function(prop, i) {
            str += prop.toString();
            if (i !== last) {
                str += ", ";
            }
        });
        str += "] }";

        return str;
    }
}

export class GentzenTree {
    public constructor(prop: Proposition) {
        this.root = new GentzenTreeNode(new Sequent([], [prop]));
    }

    public root: GentzenTreeNode;
    public tree: any;
}
export module GentzenTree {
    export abstract class InferenceRules {
    // Single-Premise Rules
        private static left_and(seq: Sequent): GentzenTreeNode[] {
            let children: GentzenTreeNode[] = [];
            if (seq.assumptions.any(function(prop) { return prop.operator === "&&"; })) {
                let assumptions: Proposition[] = [];
                seq.assumptions.forEach(function(prop) {
                    if (prop.operator === "&&") {
                        assumptions.push((typeof(prop.operand1) === "string" ? new Proposition(prop.operand1) : prop.operand1));
                        assumptions.push((typeof(prop.operand2) === "string" ? new Proposition(prop.operand2) : prop.operand2));
                    } else {
                        assumptions.push(prop);
                    }
                });
                children.push(new GentzenTreeNode(new Sequent(assumptions, seq.conclusions.slice())));
            }
            return children;
        }

        private static right_or(seq: Sequent): GentzenTreeNode[] {
            let children: GentzenTreeNode[] = [];
            if (seq.conclusions.any(function(prop) { return prop.operator === "||"; })) {
                let conclusions: Proposition[] = [];
                seq.conclusions.forEach(function(prop) {
                    if (prop.operator === "||") {
                        conclusions.push((typeof(prop.operand1) === "string" ? new Proposition(prop.operand1) : prop.operand1));
                        conclusions.push((typeof(prop.operand2) === "string" ? new Proposition(prop.operand2) : prop.operand2));
                    } else {
                        conclusions.push(prop);
                    }
                });
                children.push(new GentzenTreeNode(new Sequent(seq.assumptions.slice(), conclusions)));
            }
            return children;
        }

        private static right_imp(seq: Sequent): GentzenTreeNode[] {
            let children: GentzenTreeNode[] = [];
            if (seq.conclusions.any(function(prop) { return prop.operator === "->"; })) {
                let assumptions: Proposition[] = seq.assumptions.slice();
                let conclusions: Proposition[] = [];
                seq.conclusions.forEach(function(prop) {
                    if (prop.operator === "->") {
                        assumptions.push((typeof(prop.operand1) === "string" ? new Proposition(prop.operand1) : prop.operand1));
                        conclusions.push((typeof(prop.operand2) === "string" ? new Proposition(prop.operand2) : prop.operand2));
                    } else {
                        conclusions.push(prop);
                    }
                });
                children.push(new GentzenTreeNode(new Sequent(assumptions, conclusions)));
            }
            return children;
        }

        private static left_not(seq: Sequent): GentzenTreeNode[] {
            let children: GentzenTreeNode[] = [];
            if (seq.assumptions.any(function(prop) { return prop.operator === "!"; })) {
                let assumptions: Proposition[] = [];
                let conclusions: Proposition[] = seq.conclusions.slice();
                seq.assumptions.forEach(function(prop) {
                    if (prop.operator === "!") {
                        conclusions.push((typeof(prop.operand1) === "string" ? new Proposition(prop.operand1) : prop.operand1));
                    } else {
                        assumptions.push(prop);
                    }
                });
                children.push(new GentzenTreeNode(new Sequent(assumptions, conclusions)));
            }
            return children;
        }

        private static right_not(seq: Sequent): GentzenTreeNode[] {
            let children: GentzenTreeNode[] = [];
            if (seq.conclusions.any(function(prop) { return prop.operator === "!"; })) {
                let assumptions: Proposition[] = seq.assumptions.slice();
                let conclusions: Proposition[] = [];
                seq.conclusions.forEach(function(prop) {
                    if (prop.operator === "!") {
                        assumptions.push((typeof(prop.operand1) === "string" ? new Proposition(prop.operand1) : prop.operand1));
                    } else {
                        conclusions.push(prop);
                    }
                });
                children.push(new GentzenTreeNode(new Sequent(assumptions, conclusions)));
            }
            return children;
        }

    // Double-Premise Rules
        private static left_imp(seq: Sequent): GentzenTreeNode[] {
            let children: GentzenTreeNode[] = [];
            let index: number = seq.assumptions.firstIndexWhere(function(prop) { return prop.operator === "->"; });
            if (index >= 0) {
                let prem1: Sequent = new Sequent([], seq.conclusions.slice());
                let prem2: Sequent = new Sequent([], seq.conclusions.slice());
                seq.assumptions.forEach(function(prop, i) {
                    if (i === index) {
                        prem1.assumptions.push((typeof(prop.operand2) === "string" ? new Proposition(prop.operand2) : prop.operand2));
                        prem2.conclusions.push((typeof(prop.operand1) === "string" ? new Proposition(prop.operand1) : prop.operand1));
                    } else {
                        prem1.assumptions.push(prop);
                        prem2.assumptions.push(prop);
                    }
                });
                children.push(new GentzenTreeNode(prem1));
                children.push(new GentzenTreeNode(prem2));
            }
            return children;
        }

        private static left_or(seq: Sequent): GentzenTreeNode[] {
            let children: GentzenTreeNode[] = [];
            let index: number = seq.assumptions.firstIndexWhere(function(prop) { return prop.operator === "||"; });
            if (index >= 0) {
                let prem1: Sequent = new Sequent([], seq.conclusions.slice());
                let prem2: Sequent = new Sequent([], seq.conclusions.slice());
                seq.assumptions.forEach(function(prop, i) {
                    if (i === index) {
                        prem1.assumptions.push((typeof(prop.operand1) === "string" ? new Proposition(prop.operand1) : prop.operand1));
                        prem2.assumptions.push((typeof(prop.operand2) === "string" ? new Proposition(prop.operand2) : prop.operand2));
                    } else {
                        prem1.assumptions.push(prop);
                        prem2.assumptions.push(prop);
                    }
                });
                children.push(new GentzenTreeNode(prem1));
                children.push(new GentzenTreeNode(prem2));
            }
            return children;
        }

        private static right_and(seq: Sequent): GentzenTreeNode[] {
            let children: GentzenTreeNode[] = [];
            let index: number = seq.conclusions.firstIndexWhere(function(prop) { return prop.operator === "&&"; });
            if (index >= 0) {
                let prem1: Sequent = new Sequent(seq.assumptions.slice(), []);
                let prem2: Sequent = new Sequent(seq.assumptions.slice(), []);
                seq.conclusions.forEach(function(prop, i) {
                    if (i !== index) {
                        prem1.conclusions.push((typeof(prop.operand1) === "string" ? new Proposition(prop.operand1) : prop.operand1));
                        prem2.conclusions.push((typeof(prop.operand2) === "string" ? new Proposition(prop.operand2) : prop.operand2));
                    } else {
                        prem1.conclusions.push(prop);
                        prem2.conclusions.push(prop);
                    }
                });
                children.push(new GentzenTreeNode(prem1));
                children.push(new GentzenTreeNode(prem2));
            }
            return children;
        }

    // Ordered Rules
        /**
         * The list of inference rules used in Gentzen systems, ordered so as to produce the smallest possible trees.
         */
        public static Rules: ((seq: Sequent) => GentzenTreeNode[])[] = [
            InferenceRules.left_and,
            InferenceRules.right_or,
            InferenceRules.right_imp,
            InferenceRules.left_not,
            InferenceRules.right_not,
            InferenceRules.left_imp,
            InferenceRules.left_or,
            InferenceRules.right_and
        ];
    }
}

export class GentzenTreeNode {
    public constructor(seq: Sequent) {
        this.sequent = seq;
        this.innerHTML = `
        <div>
            <table class="ui compact celled unstackable basic table">
                <thead>
                    <tr>
                        <th class="eight wide">Assumptions</th>
                        <th class="eight wide">Conclusions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="` + (seq.finished() ? (seq.axiom() ? "positive" : "negative") : "") + `">
                        <td><pre>` + seq.assumptions.join("\n") + `</pre></td>
                        <td><pre>` + seq.conclusions.join("\n") + `</pre></td>
                    </tr>
                </tbody>
            </table>
        </div>
        `;

        if (!this.finished()) {
            this.expand();
        }
    }

    public sequent: Sequent;
    public innerHTML: string;
    public children: GentzenTreeNode[];

    public finished(): boolean {
        return this.sequent.finished();
    }

    public axiom(): boolean {
        return this.sequent.axiom();
    }

    public falsifiable(): boolean {
        return this.sequent.falsifiable();
    }

    /**
     * Finds the children of this node by applying the first applicable inference rule to the current sequents' propositions.
     */
    private expand(): void {
        let children: GentzenTreeNode[] = [];

        // Loop through inference rules until we have some new children or until all inference rules have been exhausted.
        for (let i = 0; i < GentzenTree.InferenceRules.Rules.length && children.length === 0; i++) {
            children = GentzenTree.InferenceRules.Rules[i](this.sequent);
        }

        this.children = children;
    }
}
