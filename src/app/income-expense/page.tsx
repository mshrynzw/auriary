import { getAuth } from '@/lib/auth';
import { getBankPurposesAction } from '@/app/actions/bank-purpose';
import { getBankTransactionsAction } from '@/app/actions/bank-transaction';
import type { BankPurpose } from '@/schemas/tables/m_bank_purposes';
import { IncomeExpenseView } from './income-expense-view';

export default async function IncomeExpensePage() {
  const { userProfile } = await getAuth();
  const result = await getBankTransactionsAction();
  const transactions = result.transactions || [];
  let purposes: BankPurpose[] = [];
  if (userProfile) {
    const listed = await getBankPurposesAction();
    if ('purposes' in listed) purposes = listed.purposes;
  }

  return (
    <div className="aurialy">
      <div className="container mx-auto py-8 px-4">
        <IncomeExpenseView
          initialTransactions={transactions}
          purposes={purposes}
          isAuthenticated={!!userProfile}
        />
      </div>
    </div>
  );
}
