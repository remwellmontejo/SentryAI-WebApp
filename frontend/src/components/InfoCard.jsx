import React from 'react'

const InfoCard = ({ title, content, children, properties, properties_for_value }) => {
    return (
        <div className={`card w-full border border-gray-200 shadow-lg ${properties ? properties : 'bg-base-300'}`}>
            <div className="card-body p-4 sm:p-6">
                <div className='flex flex-row justify-between items-center'>
                    <h1 className={`font-bold text-4xl sm:text-7xl ${properties_for_value}`}>{content}</h1>
                    {children}
                </div>
                <h2 className="card-title text-sm sm:text-base text-[#000060]">{title}</h2>
            </div>
        </div>
    )
}

export default InfoCard
