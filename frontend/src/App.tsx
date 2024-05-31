import Download from './main/Download';
import Footer from './main/Footer';
import Header from './main/Header';
import Main from './main/Main';

const App = () => {
	return (
		<div className="w-[350px] h-[400px] bg-background font-body border-2 border-white">
			<Header />
			<Main />
			<Download />
			<Footer />
		</div>
	);
};

export default App;
