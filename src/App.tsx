import Video from './components/Video';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Circle Search</h1>
        <div className="w-[640px] h-[360px] mb-4">
          <Video />
        </div>
        <p className="text-gray-600 mb-4">
          Press <kbd className="px-2 py-1 bg-gray-100 rounded">⌘</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">⇧</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">C</kbd> to start
        </p>
        <p className="text-sm text-gray-500">
          Draw a circle around the area you want to search
        </p>
      </div>
    </div>
  );
}

export default App; 