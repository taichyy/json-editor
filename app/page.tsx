import { redirect } from 'next/navigation';

// Redirect bare "/" to the default locale
const RootPage = () => {
    redirect('/en');
};

export default RootPage;
