import React, { useEffect, useState } from 'react'
import Websocket from 'react-websocket';
import BTable from 'react-bootstrap/Table';
import { useTable } from 'react-table';
import axios from 'axios';
import _ from 'lodash';

import 'bootstrap/dist/css/bootstrap.min.css';


const fetchData = async () => {
    return await axios.get('http://127.0.0.1:8000/');
};

const fetchSingeData = async (id) => {
    return await axios.get('http://127.0.0.1:8000/' + id);
};

function Table({ columns, data }) {
    // Use the state and functions returned from useTable to build your UI
    const { getTableProps, headerGroups, rows, prepareRow } = useTable({
        columns,
        data,
    })

    // Render the UI for your table
    return (
        <BTable striped bordered hover size="sm" {...getTableProps()}>
            <thead>
                {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map(column => (
                            <th {...column.getHeaderProps()}>
                                {column.render('Header')}
                            </th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody>
                {rows.map((row, i) => {
                    prepareRow(row)
                    return (
                        <tr {...row.getRowProps()}>
                            {row.cells.map(cell => {
                                return (
                                    <td {...cell.getCellProps()}>
                                        {cell.render('Cell')}
                                    </td>
                                )
                            })}
                        </tr>
                    )
                })}
            </tbody>
        </BTable>
    )
}

function Main() {
    const columns = React.useMemo(
        () => [
            {
                Header: 'Machines',
                columns: [
                    {
                        Header: 'Name',
                        accessor: 'name',
                    },

                ],
            },

        ],
        []
    )

    // const data = makeData();

    const [data, setData] = useState([]);
    const [loaded, setLoaded] = useState(0);

    const handleMessage = (id) => {

        if (id !== 'Connected') {
            fetchSingeData(id)
                .then(response => {
                    const responseData = response.data[0];

                    const indexFound = _.findIndex(data, (item) => { return item.id === responseData.id });
                    const newData = [...data];

                    if (indexFound !== -1) {
                        newData[indexFound] = responseData;

                    } else {
                        newData.push(responseData);
                    }
                    setData(newData);

                })
                .catch(error => {
                    setData([]); // reset the [] here - this is optional and is based on expected behaviour
                    console.log(error);
                });
            // .finally(() => setUpdated(updated + 1));

        }


    }

    useEffect(() => {

        async function getData() {
            fetchData()
                .then(response => {
                    setLoaded(1);
                    const responseData = response.data;
                    const morphedData = responseData.map(item => ({
                        id: item.id,
                        name: item.name ? item.name : 'empty'

                    }));
                    setData(morphedData);
                })
                .catch(error => {
                    setData([]); // reset the [] here - this is optional and is based on expected behaviour
                    console.log(error);
                });
            // .finally(() => setLoading(false));

            console.log('loading');
        }
        if (data.length === 0 && loaded === 0) {
            getData();
        }


    }, [data]);

    return (
        data &&
        <div>

            <Websocket url='ws://localhost:8080' onMessage={handleMessage} />
            <Table columns={columns} data={data} />
        </div >
    )
}

export default Main;
