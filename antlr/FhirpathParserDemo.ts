import { CharStream, CommonTokenStream, ParseTreeVisitor } from 'antlr4';
import fhirpathLexer from './generated/fhirpathLexer.js';
import fhirpathParser from './generated/fhirpathParser.js';
import fhirpathVisitor from './generated/fhirpathVisitor.js';

/**
 * A simple visitor that extracts information from FHIRPath expressions
 */
class FhirpathAnalyzer extends ParseTreeVisitor<string> {
    
    visitEntireExpression(ctx: any): string {
        return `EntireExpression: ${this.visit(ctx.expression())}`;
    }
    
    visitTermExpression(ctx: any): string {
        return `Term: ${this.visit(ctx.term())}`;
    }
    
    visitInvocationExpression(ctx: any): string {
        const expr = this.visit(ctx.expression());
        const invocation = this.visit(ctx.invocation());
        return `${expr}.${invocation}`;
    }
    
    visitIndexerExpression(ctx: any): string {
        const expressions = ctx.expression();
        const base = this.visit(expressions[0]);
        const index = this.visit(expressions[1]);
        return `${base}[${index}]`;
    }
    
    visitMultiplicativeExpression(ctx: any): string {
        const expressions = ctx.expression();
        const left = this.visit(expressions[0]);
        const right = this.visit(expressions[1]);
        const operator = ctx.getText().includes('*') ? '*' : 
                        ctx.getText().includes('/') ? '/' : 
                        ctx.getText().includes('div') ? 'div' : 'mod';
        return `(${left} ${operator} ${right})`;
    }
    
    visitAdditiveExpression(ctx: any): string {
        const expressions = ctx.expression();
        const left = this.visit(expressions[0]);
        const right = this.visit(expressions[1]);
        const operator = ctx.getText().includes('+') ? '+' : 
                        ctx.getText().includes('-') ? '-' : '&';
        return `(${left} ${operator} ${right})`;
    }
    
    visitEqualityExpression(ctx: any): string {
        const expressions = ctx.expression();
        const left = this.visit(expressions[0]);
        const right = this.visit(expressions[1]);
        const text = ctx.getText();
        const operator = text.includes('!=') ? '!=' : 
                        text.includes('!~') ? '!~' : 
                        text.includes('=') ? '=' : '~';
        return `(${left} ${operator} ${right})`;
    }
    
    visitAndExpression(ctx: any): string {
        const expressions = ctx.expression();
        const left = this.visit(expressions[0]);
        const right = this.visit(expressions[1]);
        return `(${left} and ${right})`;
    }
    
    visitOrExpression(ctx: any): string {
        const expressions = ctx.expression();
        const left = this.visit(expressions[0]);
        const right = this.visit(expressions[1]);
        const operator = ctx.getText().includes('xor') ? 'xor' : 'or';
        return `(${left} ${operator} ${right})`;
    }
    
    visitInvocationTerm(ctx: any): string {
        return this.visit(ctx.invocation());
    }
    
    visitLiteralTerm(ctx: any): string {
        return this.visit(ctx.literal());
    }
    
    visitParenthesizedTerm(ctx: any): string {
        return `(${this.visit(ctx.expression())})`;
    }
    
    visitStringLiteral(ctx: any): string {
        return ctx.getText();
    }
    
    visitNumberLiteral(ctx: any): string {
        return ctx.getText();
    }
    
    visitBooleanLiteral(ctx: any): string {
        return ctx.getText();
    }
    
    visitDateLiteral(ctx: any): string {
        return ctx.getText();
    }
    
    visitMemberInvocation(ctx: any): string {
        return this.visit(ctx.identifier());
    }
    
    visitFunctionInvocation(ctx: any): string {
        return this.visit(ctx.function_());
    }
    
    visitFunction(ctx: any): string {
        const name = this.visit(ctx.identifier());
        const params = ctx.paramList() ? this.visit(ctx.paramList()) : '';
        return `${name}(${params})`;
    }
    
    visitParamList(ctx: any): string {
        const expressions = ctx.expression();
        return expressions.map((expr: any) => this.visit(expr)).join(', ');
    }
    
    visitIdentifier(ctx: any): string {
        return ctx.getText();
    }
    
    // Default visit method for unhandled cases
    visitChildren(node: any): string {
        if (!node) return '';
        
        let result = '';
        const childCount = node.getChildCount ? node.getChildCount() : 0;
        
        for (let i = 0; i < childCount; i++) {
            const child = node.getChild(i);
            if (child) {
                const childResult = this.visit(child);
                if (childResult) {
                    result += childResult;
                }
            }
        }
        
        return result || node.getText();
    }
}

/**
 * Parse a FHIRPath expression and return the parse tree analysis
 */
export function parseFhirpathExpression(expression: string): string {
    try {
        // Create lexer
        const input = new CharStream(expression);
        const lexer = new fhirpathLexer(input);
        
        // Create token stream
        const tokens = new CommonTokenStream(lexer);
        
        // Create parser
        const parser = new fhirpathParser(tokens);
        
        // Parse the expression
        const tree = parser.entireExpression();
        
        // Analyze with visitor
        const analyzer = new FhirpathAnalyzer();
        return analyzer.visit(tree);
        
    } catch (error) {
        return `Parse error: ${error}`;
    }
}

/**
 * Example usage and demonstration
 */
export function demonstrateFhirpathParser() {
    const expressions = [
        "Patient.name.given",
        "Patient.name[0].family",
        "Patient.age > 18",
        "Patient.name.given.count() > 0",
        "Patient.telecom.where(system = 'phone')",
        "Observation.value as Quantity",
        "(Patient.age + 5) * 2"
    ];
    
    console.log("=== FHIRPath Parser Demonstration ===\n");
    
    expressions.forEach(expr => {
        console.log(`Expression: ${expr}`);
        console.log(`Analysis:   ${parseFhirpathExpression(expr)}`);
        console.log();
    });
}

// Export the main components
export { fhirpathLexer, fhirpathParser, fhirpathVisitor, FhirpathAnalyzer }; 