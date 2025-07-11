import type {
    FhirpathVisitor,
    EntireExpressionContext,
    TermExpressionContext,
    InvocationExpressionContext,
    IndexerExpressionContext,
    PolarityExpressionContext,
    MultiplicativeExpressionContext,
    AdditiveExpressionContext,
    TypeExpressionContext,
    UnionExpressionContext,
    InequalityExpressionContext,
    EqualityExpressionContext,
    MembershipExpressionContext,
    AndExpressionContext,
    OrExpressionContext,
    ImpliesExpressionContext,
    InvocationTermContext,
    LiteralTermContext,
    ExternalConstantTermContext,
    ParenthesizedTermContext,
    NullLiteralContext,
    BooleanLiteralContext,
    StringLiteralContext,
    NumberLiteralContext,
    LongNumberLiteralContext,
    DateLiteralContext,
    DateTimeLiteralContext,
    TimeLiteralContext,
    QuantityLiteralContext,
    MemberInvocationContext,
    FunctionInvocationContext,
    ThisInvocationContext,
    IndexInvocationContext,
    TotalInvocationContext,
    ExternalConstantContext,
    FunctionContext,
    ParamListContext,
    QuantityContext,
    UnitContext,
    DateTimePrecisionContext,
    PluralDateTimePrecisionContext,
    TypeSpecifierContext,
    QualifiedIdentifierContext,
    IdentifierContext,
    ParseRuleContext
} from './FhirpathVisitor';

/**
 * Base visitor implementation that provides default behavior for all visitor methods.
 * Subclasses can override specific methods as needed.
 */
export class FhirpathBaseVisitor<T> implements FhirpathVisitor<T> {
    
    /**
     * Default implementation visits all children and returns the result of the last child.
     * Subclasses can override this method to provide custom default behavior.
     */
    protected defaultResult(): T {
        return undefined as any;
    }
    
    /**
     * Visits all children of the given context.
     */
    protected visitChildren(ctx: ParseRuleContext): T {
        let result = this.defaultResult();
        const childCount = ctx.getChildCount();
        
        for (let i = 0; i < childCount; i++) {
            const child = ctx.getChild(i);
            if (child) {
                const childResult = child.accept(this);
                result = this.aggregateResult(result, childResult);
            }
        }
        
        return result;
    }
    
    /**
     * Aggregates results from multiple children.
     * Default implementation returns the last non-null result.
     */
    protected aggregateResult(aggregate: T, nextResult: T): T {
        return nextResult !== undefined ? nextResult : aggregate;
    }

    // Top-level expressions
    visitEntireExpression(ctx: EntireExpressionContext): T {
        return this.visitChildren(ctx);
    }
    
    // Expression types
    visitTermExpression(ctx: TermExpressionContext): T {
        return this.visitChildren(ctx);
    }
    
    visitInvocationExpression(ctx: InvocationExpressionContext): T {
        return this.visitChildren(ctx);
    }
    
    visitIndexerExpression(ctx: IndexerExpressionContext): T {
        return this.visitChildren(ctx);
    }
    
    visitPolarityExpression(ctx: PolarityExpressionContext): T {
        return this.visitChildren(ctx);
    }
    
    visitMultiplicativeExpression(ctx: MultiplicativeExpressionContext): T {
        return this.visitChildren(ctx);
    }
    
    visitAdditiveExpression(ctx: AdditiveExpressionContext): T {
        return this.visitChildren(ctx);
    }
    
    visitTypeExpression(ctx: TypeExpressionContext): T {
        return this.visitChildren(ctx);
    }
    
    visitUnionExpression(ctx: UnionExpressionContext): T {
        return this.visitChildren(ctx);
    }
    
    visitInequalityExpression(ctx: InequalityExpressionContext): T {
        return this.visitChildren(ctx);
    }
    
    visitEqualityExpression(ctx: EqualityExpressionContext): T {
        return this.visitChildren(ctx);
    }
    
    visitMembershipExpression(ctx: MembershipExpressionContext): T {
        return this.visitChildren(ctx);
    }
    
    visitAndExpression(ctx: AndExpressionContext): T {
        return this.visitChildren(ctx);
    }
    
    visitOrExpression(ctx: OrExpressionContext): T {
        return this.visitChildren(ctx);
    }
    
    visitImpliesExpression(ctx: ImpliesExpressionContext): T {
        return this.visitChildren(ctx);
    }
    
    // Term types
    visitInvocationTerm(ctx: InvocationTermContext): T {
        return this.visitChildren(ctx);
    }
    
    visitLiteralTerm(ctx: LiteralTermContext): T {
        return this.visitChildren(ctx);
    }
    
    visitExternalConstantTerm(ctx: ExternalConstantTermContext): T {
        return this.visitChildren(ctx);
    }
    
    visitParenthesizedTerm(ctx: ParenthesizedTermContext): T {
        return this.visitChildren(ctx);
    }
    
    // Literal types
    visitNullLiteral(ctx: NullLiteralContext): T {
        return this.visitChildren(ctx);
    }
    
    visitBooleanLiteral(ctx: BooleanLiteralContext): T {
        return this.visitChildren(ctx);
    }
    
    visitStringLiteral(ctx: StringLiteralContext): T {
        return this.visitChildren(ctx);
    }
    
    visitNumberLiteral(ctx: NumberLiteralContext): T {
        return this.visitChildren(ctx);
    }
    
    visitLongNumberLiteral(ctx: LongNumberLiteralContext): T {
        return this.visitChildren(ctx);
    }
    
    visitDateLiteral(ctx: DateLiteralContext): T {
        return this.visitChildren(ctx);
    }
    
    visitDateTimeLiteral(ctx: DateTimeLiteralContext): T {
        return this.visitChildren(ctx);
    }
    
    visitTimeLiteral(ctx: TimeLiteralContext): T {
        return this.visitChildren(ctx);
    }
    
    visitQuantityLiteral(ctx: QuantityLiteralContext): T {
        return this.visitChildren(ctx);
    }
    
    // Invocation types
    visitMemberInvocation(ctx: MemberInvocationContext): T {
        return this.visitChildren(ctx);
    }
    
    visitFunctionInvocation(ctx: FunctionInvocationContext): T {
        return this.visitChildren(ctx);
    }
    
    visitThisInvocation(ctx: ThisInvocationContext): T {
        return this.visitChildren(ctx);
    }
    
    visitIndexInvocation(ctx: IndexInvocationContext): T {
        return this.visitChildren(ctx);
    }
    
    visitTotalInvocation(ctx: TotalInvocationContext): T {
        return this.visitChildren(ctx);
    }
    
    // Other constructs
    visitExternalConstant(ctx: ExternalConstantContext): T {
        return this.visitChildren(ctx);
    }
    
    visitFunction(ctx: FunctionContext): T {
        return this.visitChildren(ctx);
    }
    
    visitParamList(ctx: ParamListContext): T {
        return this.visitChildren(ctx);
    }
    
    visitQuantity(ctx: QuantityContext): T {
        return this.visitChildren(ctx);
    }
    
    visitUnit(ctx: UnitContext): T {
        return this.visitChildren(ctx);
    }
    
    visitDateTimePrecision(ctx: DateTimePrecisionContext): T {
        return this.visitChildren(ctx);
    }
    
    visitPluralDateTimePrecision(ctx: PluralDateTimePrecisionContext): T {
        return this.visitChildren(ctx);
    }
    
    visitTypeSpecifier(ctx: TypeSpecifierContext): T {
        return this.visitChildren(ctx);
    }
    
    visitQualifiedIdentifier(ctx: QualifiedIdentifierContext): T {
        return this.visitChildren(ctx);
    }
    
    visitIdentifier(ctx: IdentifierContext): T {
        return this.visitChildren(ctx);
    }
} 