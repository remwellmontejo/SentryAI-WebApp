import React from 'react'

const InfoCard = ({ title, content, children, properties, properties_for_value }) => {
    return (
        <div className={`card bg-base-300 w-2xs shadow-lg ${properties}`}>
            <div className="card-body">
                <div className='flex flex-row justify-between items-center'>
                    <h1 className={`font-bold text-7xl ${properties_for_value}`}>{content}</h1>
                    {children}
                </div>
                <h2 className="card-title text-base-content">{title}</h2>
            </div>
        </div>
    )
}

export default InfoCard
