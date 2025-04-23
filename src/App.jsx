import React, { useEffect, useState } from 'react';
import './App.css';

const Dashboard = () => {
    const [printers, setPrinters] = useState([]);

    useEffect(() => {
        // Fetch printers from the backend
        fetch('http://localhost:5000/api/printers')
            .then((response) => response.json())
            .then((data) => setPrinters(data))
            .catch((error) => console.error('Error fetching printers:', error));
    }, []);

    // Filter printers whose names start with "HP"
    const hpPrinters = printers.filter((printer) =>
        printer.name.toLowerCase().startsWith('hp')
    );
    const nonPrinters = printers.filter((printer) =>
        !printer.name.toLowerCase().startsWith('hp')
    );

    return (
        <div className="dashboard">
            <h1>Admin Dashboard</h1>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Status</th>
                        <th>IP</th>
                    </tr>
                </thead>
                <tbody>
                    {hpPrinters.map((printer) => (
                        <Row printer={printer} />
                    ))}
                    {nonPrinters.map((printer) => (
                        <Row printer={printer} />
                    ))}

                </tbody>
            </table>
        </div>
    );
};
function Row({ printer }) {
    const [displayIframe, setDisplayIframe] = useState(false)
    const handleClick = () => {
        setDisplayIframe(!displayIframe)
    }
    return (
        <>
            <tr key={printer.id} onClick={handleClick} >
                <td>{printer.id}</td>
                <td>{printer.name}</td>
                <td>{printer.status}</td>
                <td>{printer.ip}</td>
            </tr>
            {displayIframe &&
                <tr>
                    <td colSpan={4}>
                        <iframe src={(displayIframe) ? `http://localhost:5000/proxy/${printer.ip}` : null} width="100%" height="500px"></iframe>
                    </td>
                </tr>
            }
        </>
    )
}
function App() {
    return (
        <div className="App">
            <Dashboard />
        </div>
    );
}

export default App;
