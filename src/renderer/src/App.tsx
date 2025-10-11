import NavHeader from './components/NavHeader';
import GameCards from './components/GameCards';

function App(): React.JSX.Element {
  return (
    <>
      <NavHeader />
      <div className="relative w-full">
        <div className="">
          <GameCards />
        </div>
      </div>
    </>
  );
}
export default App;
