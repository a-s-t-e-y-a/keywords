import { useState } from 'react'

import axios from 'axios'


function App() {
  const [response, setResponse] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(event.target);
    const subject = formData.get('subject');
    const depth = formData.get('depth');
    const openAIKey = formData.get('openAIKey');

    try {
      const result = await axios.post('http://localhost:3000/api/generate-map', {
        subject,
        depth,
        openAIKey
      });

      const jsonResponse = result.data;
      console.log(jsonResponse);
      setResponse(jsonResponse);
    } catch (error) {
      console.error('Error generating knowledge map:', error);
      setResponse('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTable = (data) => {
    if (!data) return null;
    
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data.replace(/<\/?html>/g, '')) : data;
      const topics = parsed.topics;
      console.log(topics);
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full text-black bg-white border border-gray-300">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Level 1</th>
                <th className="px-4 py-2 border">Level 2</th>
                <th className="px-4 py-2 border">Level 3</th>
                <th className="px-4 py-2 border">Level 4</th>
              </tr>
            </thead>
            <tbody>
              {topics.level_1.map((level1Item, index) => {
                const level2Items = topics.level_2[level1Item] || [];
                let rows = [];

                level2Items.forEach((level2Item, l2Index) => {
                  const level3Items = topics.level_3[level2Item] || [];
                  
                  level3Items.forEach((level3Item, l3Index) => {
                    const level4Items = topics.level_4[level3Item] || [];
                    
                    level4Items.forEach((level4Item, l4Index) => {
                      rows.push(
                        <tr key={`${index}-${l2Index}-${l3Index}-${l4Index}`}>
                          {l2Index === 0 && l3Index === 0 && l4Index === 0 && (
                            <td className="px-4 py-2 border" rowSpan={level2Items.length * 5 * 5}>
                              {level1Item}
                            </td>
                          )}
                          {l3Index === 0 && l4Index === 0 && (
                            <td className="px-4 py-2 border" rowSpan={5 * 5}>
                              {level2Item}
                            </td>
                          )}
                          {l4Index === 0 && (
                            <td className="px-4 py-2 border" rowSpan={5}>
                              {level3Item}
                            </td>
                          )}
                          <td className="px-4 py-2 border">{level4Item}</td>
                        </tr>
                      );
                    });
                  });
                });

                return rows;
              })}
            </tbody>
          </table>
        </div>
      );
    } catch (error) {
      return <div className="text-red-500">Error parsing response: {error.message}</div>;
    }
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
          renderTable(response)
        ) : (
          <p className="text-gray-500">No data to display</p>
        )}
      </div>
    </div>
  );
}

export default App
