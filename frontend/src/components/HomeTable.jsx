import React from 'react'

const HomeTable = () => {
    return (
        <div className="overflow-x-auto rounded-lg shadow-lg" data-theme="corporateBlue">
            <table className="table table-zebra w-full">

                {/* Using bg-base-200 for a slightly different header background */}
                <thead className="bg-base-200 text-base-content">
                    <tr>
                        <th>Location</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th></th> {/* Empty header for the button column */}
                    </tr>
                </thead>

                <tbody>
                    {/* Row 1 */}
                    <tr>
                        <td>Warehouse A (Sector 3)</td>
                        <td>2025-10-21</td>
                        <td>14:30:15</td>
                        <td>
                            <button className="btn btn-primary btn-sm">View</button>
                        </td>
                    </tr>

                    {/* Row 2 */}
                    <tr>
                        <td>Main Entrance</td>
                        <td>2025-10-21</td>
                        <td>14:28:02</td>
                        <td>
                            <button className="btn btn-primary btn-sm">View</button>
                        </td>
                    </tr>

                    {/* Row 3 */}
                    <tr>
                        <td>Loading Bay 2</td>
                        <td>2025-10-20</td>
                        <td>08:15:55</td>
                        <td>
                            <button className="btn btn-primary btn-sm">View</button>
                        </td>
                    </tr>

                    {/* Row 4 */}
                    <tr>
                        <td>Perimeter Fence (North)</td>
                        <td>2025-10-19</td>
                        <td>23:55:12</td>
                        <td>
                            <button className="btn btn-primary btn-sm">View</button>
                        </td>
                    </tr>
                </tbody>

            </table>
        </div>
    )
}

export default HomeTable
