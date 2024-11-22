import { useState } from 'react'

import axios from 'axios'


function App() {
  const [response, setResponse] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [keywords, setKeywords] = useState([])

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(event.target);
    const subject = formData.get('subject');
    const depth = formData.get('depth');
    const openAIKey = formData.get('openAIKey');

    try {
      const result = await axios.post('http://localhost:4000/api/generate-map', {
        subject,
        depth,
        openAIKey
      });

      const jsonResponse = result.data;
      console.log(jsonResponse);
      setResponse(jsonResponse);
      if (jsonResponse.keywords) {
        setKeywords(jsonResponse.keywords);
      }
    } catch (error) {
      console.error('Error generating knowledge map:', error);
      setResponse('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!keywords.length) return;
    
    const csvContent = "data:text/csv;charset=utf-8," + keywords.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "keywords.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderKeywords = (data) => {
    if (!data || !data.keywords || !data.keywords.length) return null;
    
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Keywords ({data.keywords.length})</h3>
          <button
            onClick={downloadCSV}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Download CSV
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.keywords.map((keyword, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-3 hover:shadow-lg transition-shadow duration-200"
            >
              <p className="text-gray-800 text-sm">{keyword}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Loader = () => (
    <div className="flex justify-center items-center my-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-gray-700">Processing your request...</span>
    </div>
  );

  return (
    <div className="App p-4">
      <form className="max-w-md mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="subject" className="block text-gray-700 text-sm font-bold mb-2">Subject:</label>
          <input
            type="text"
            id="subject"
            name="subject"
            placeholder="Enter subject"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-black bg-white leading-tight focus:outline-none focus:shadow-outline placeholder-black"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="depth" className="block text-gray-700 text-sm font-bold mb-2">Depth:</label>
          <input
            type="text"
            id="depth"
            name="depth"
            placeholder="Enter depth"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-black bg-white leading-tight focus:outline-none focus:shadow-outline placeholder-black"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="openAIKey" className="block text-gray-700 text-sm font-bold mb-2">OpenAI Key:</label>
          <input
            type="text"
            id="openAIKey"
            name="openAIKey"
            placeholder="Enter OpenAI Key"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-black bg-white leading-tight focus:outline-none focus:shadow-outline placeholder-black"
          />
        </div>
        <div className="flex items-center justify-between">
          <button 
            type="submit" 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Submit'}
          </button>
        </div>
      </form>
      <div className="mt-4">
        <h2 className="text-lg font-bold mb-4">Response:</h2>
        {isLoading ? (
          <Loader />
        ) : response ? (
          renderKeywords(response)
        ) : (
          <p className="text-gray-500">No data to display</p>
        )}
      </div>
    </div>
  );
}

export default App
