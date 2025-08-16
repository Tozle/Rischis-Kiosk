import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function BuzzerPotSummary({ round_id }: { round_id: string | null }) {
    const [pot, setPot] = useState<string>('—');
    const [house, setHouse] = useState<string>('—');
    const [net, setNet] = useState<string>('—');

    useEffect(() => {
        if (!round_id) return;
        let ignore = false;
        async function fetchPot() {
            const { data } = await supabase
                .from('buzzer_round_state')
                .select('pot_eur, house_fee_eur, net_pot_eur')
                .eq('round_id', round_id)
                .single();
            if (!ignore && data) {
                setPot(data.pot_eur?.toFixed(2) ?? '—');
                setHouse(data.house_fee_eur?.toFixed(2) ?? '—');
                setNet(data.net_pot_eur?.toFixed(2) ?? '—');
            }
        }
        fetchPot();
        // Supabase v2 Realtime-API: channel
        const channel = supabase.channel(`buzzer-pot-${round_id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'buzzer_round_state',
                    filter: `round_id=eq.${round_id}`,
                },
                fetchPot
            )
            .subscribe();
        return () => {
            ignore = true;
            supabase.removeChannel(channel);
        };
    }, [round_id]);

    return (
        <div className="mb-4">
            <h3 className="font-semibold">Pot / House / Net</h3>
            <div>Pot: {pot} €</div>
            <div>House: {house} €</div>
            <div>Net: {net} €</div>
        </div>
    );
}
