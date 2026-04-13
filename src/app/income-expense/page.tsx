import { getAuth } from '@/lib/auth';
import { getBankTransactionsAction } from '@/app/actions/bank-transaction';
import { IncomeExpenseView } from './income-expense-view';

export default async function IncomeExpensePage() {
  const { userProfile } = await getAuth();
  const result = await getBankTransactionsAction();
  const transactions = result.transactions || [];

  return (
    <div className="aurialy">
      <div className="container mx-auto py-8 px-4">
        <IncomeExpenseView initialTransactions={transactions} isAuthenticated={!!userProfile} />
      </div>
    </div>
  );
}
