import { FC } from 'react';
import Icon from '@mui/icons-material/NewReleases';

import CardWithIcon from './CardWithIcon';

interface Props {
    value?: string;
}

const UntriggeredJobs: FC<Props> = ({ value }) => {
    return (
        <CardWithIcon
            to='/jobs?filter={"status":"untriggered"}'
            icon={Icon}
            title='Untriggered Jobs'
            subtitle={value}
            color="#d69e2e"
        />
    );
};

export default UntriggeredJobs;
